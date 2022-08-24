#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::read_dir;
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![read_dir_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn read_dir_file(path: String) -> Vec<String> {
    let mut arr: Vec<String> = vec![];
    for item in read_dir(path).unwrap() {
        if !item.as_ref().unwrap().path().is_dir() {
            arr.push(item.unwrap().file_name().into_string().unwrap());
        }
    }
    return arr;
}
