use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Word {
    pub word: String,
    pub orp_index: usize,
    pub pause_after: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Chapter {
    pub title: String,
    pub position: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ParseResult {
    pub title: String,
    pub author: String,
    pub format: String,
    pub chapters: Vec<Chapter>,
    pub words: Vec<Word>,
    pub word_count: usize,
    #[serde(default)]
    pub error: Option<String>,
}

/// Parse an ebook file using the bundled Python backend sidecar
#[tauri::command]
async fn parse_ebook(app: tauri::AppHandle, file_path: String) -> Result<ParseResult, String> {
    struct BackendOutput {
        success: bool,
        stdout: Vec<u8>,
        stderr: Vec<u8>,
    }

    use std::process::Command;
    use tauri_plugin_shell::ShellExt;

    println!("[parse_ebook] Starting parse for: {}", file_path);
    let output = match std::env::var("RSVP_READER_BACKEND") {
        Ok(command) => {
            println!("[parse_ebook] Running backend command: {}", command);
            let output = Command::new(command)
                .args(["parse", "--words-only", &file_path])
                .output()
                .map_err(|e| format!("Failed to run backend command: {}", e))?;
            BackendOutput {
                success: output.status.success(),
                stdout: output.stdout,
                stderr: output.stderr,
            }
        }
        Err(_) => {
            println!("[parse_ebook] Running bundled sidecar...");
            let output = app
                .shell()
                .sidecar("python-backend")
                .map_err(|e| format!("Failed to create sidecar command: {}", e))?
                .args(["parse", "--words-only", &file_path])
                .output()
                .await
                .map_err(|e| format!("Failed to run sidecar: {}", e))?;
            BackendOutput {
                success: output.status.success(),
                stdout: output.stdout,
                stderr: output.stderr,
            }
        }
    };

    println!(
        "[parse_ebook] Backend finished, success={}, stdout_len={}, stderr_len={}",
        output.success,
        output.stdout.len(),
        output.stderr.len()
    );

    if !output.success {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        println!("[parse_ebook] Backend error - stderr: {}", stderr);
        println!("[parse_ebook] Backend error - stdout: {}", stdout);
        return Err(format!(
            "Backend error: {}",
            if stderr.is_empty() {
                stdout.to_string()
            } else {
                stderr.to_string()
            }
        ));
    }

    let stdout =
        String::from_utf8(output.stdout).map_err(|e| format!("Invalid UTF-8 output: {}", e))?;

    println!(
        "[parse_ebook] Parsing JSON response ({} bytes)...",
        stdout.len()
    );

    // Try to parse and extract more detailed error if it fails
    match serde_json::from_str::<ParseResult>(&stdout) {
        Ok(result) => {
            // Check if the result contains an error field
            if let Some(ref error) = result.error {
                println!("[parse_ebook] Backend returned error: {}", error);
                return Err(error.clone());
            }
            println!(
                "[parse_ebook] Successfully parsed {} words",
                result.words.len()
            );
            Ok(result)
        }
        Err(e) => {
            let preview = if stdout.len() > 500 {
                format!("{}...(truncated)", &stdout[..500])
            } else {
                stdout.clone()
            };
            println!(
                "[parse_ebook] JSON parse error: {} - Preview: {}",
                e, preview
            );
            Err(format!(
                "Failed to parse JSON: {} - Response preview: {}",
                e, preview
            ))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![parse_ebook])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
