use tauri::Manager;
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
    use tauri_plugin_shell::ShellExt;
    
    println!("[parse_ebook] Starting parse for: {}", file_path);
    
    // Use the sidecar command - Tauri will find the correct binary for the platform
    let sidecar_command = app.shell()
        .sidecar("python-backend")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?
        .args(["parse", "--words-only", &file_path]);
    
    println!("[parse_ebook] Running sidecar...");
    
    let output = sidecar_command
        .output()
        .await
        .map_err(|e| format!("Failed to run sidecar: {}", e))?;
    
    println!("[parse_ebook] Sidecar finished, success={}, stdout_len={}, stderr_len={}", 
             output.status.success(), 
             output.stdout.len(),
             output.stderr.len());
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        println!("[parse_ebook] Backend error - stderr: {}", stderr);
        println!("[parse_ebook] Backend error - stdout: {}", stdout);
        return Err(format!("Backend error: {}", if stderr.is_empty() { stdout.to_string() } else { stderr.to_string() }));
    }
    
    let stdout = String::from_utf8(output.stdout)
        .map_err(|e| format!("Invalid UTF-8 output: {}", e))?;
    
    println!("[parse_ebook] Parsing JSON response ({} bytes)...", stdout.len());
    
    // Try to parse and extract more detailed error if it fails
    match serde_json::from_str::<ParseResult>(&stdout) {
        Ok(result) => {
            // Check if the result contains an error field
            if let Some(ref error) = result.error {
                println!("[parse_ebook] Backend returned error: {}", error);
                return Err(error.clone());
            }
            println!("[parse_ebook] Successfully parsed {} words", result.words.len());
            Ok(result)
        }
        Err(e) => {
            let preview = if stdout.len() > 500 { 
                format!("{}...(truncated)", &stdout[..500]) 
            } else { 
                stdout.clone() 
            };
            println!("[parse_ebook] JSON parse error: {} - Preview: {}", e, preview);
            Err(format!("Failed to parse JSON: {} - Response preview: {}", e, preview))
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
