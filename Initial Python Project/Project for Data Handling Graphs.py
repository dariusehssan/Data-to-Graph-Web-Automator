# -*- coding: utf-8 -*-
"""
Created on Sun Mar  1 09:36:35 2026

@author: dariu
"""

import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

def load_data():
    current_dir = Path(__file__).resolve().parent
    folder = current_dir / "data"
    files = list(folder.glob("*.[cC][sS][vV]"))

    if not files:
        print("No CSV files found in the 'data' folder!")
        return None

    print("--- Available Files ---")
    for i, file in enumerate(files):
        print(f"[{i}] {file.name}")

    choice = int(input("Select a file number: "))
    file_path = files[choice]

    file = pd.read_csv(file_path, sep=';')
    print(f"Successfully loaded: {file_path.name}")

    file.columns = file.columns.str.strip().str.replace(' ', '_').str.replace(r'[()]', '', regex=True)

    return file

def setup_data_format(file):
    print("--- Data Configuration Mode ---")

    while input("Rename a column? (y/n): ").lower() == 'y':
        old_name = input("Enter current name: ")

        if old_name not in file.columns:
            print(f"Error: '{old_name}' not found. Available: {list(file.columns)}")
            continue

        new_name = input(f"Enter new name for '{old_name}': ")
        file = file.rename(columns={old_name: new_name})
        print(f"Renamed '{old_name}' to '{new_name}'.")

    while input("Convert column to numeric? (y/n): ").lower() == 'y':
        col = input("Enter column name: ")

        if col not in file.columns:
            print(f"Error: '{col}' not found. Available: {list(file.columns)}")
            continue

        file[col] = pd.to_numeric(file[col], errors='coerce')
        print(f"Converted '{col}' to numeric.")

    return file

def generate_graphs(file):
    print("--- Graphing Mode ---")

    while input("Create a graph? (y/n): ").lower() == 'y':
        print(f"Available columns: {list(file.columns)}")
        fig, ax = plt.subplots(figsize=(10, 6))

        x_col = input("Enter X-axis column: ")
        if x_col not in file.columns:
            print("Invalid X-axis column.")
            continue

        is_multi = input("Is this a multi-variable graph? (y/n): ").lower() == 'y'

        plt.figure(figsize=(10, 6))

        if not is_multi:
            y_col = input("Enter Y-axis column: ")
            if y_col in file.columns:
                ax.plot(file[x_col], file[y_col], marker='o', label=y_col)
            else:
                print("Invalid Y-axis column.")
                plt.close(fig)
                continue
        else:
            y_input = input("Enter Y-axis columns separated by commas: ")
            y_cols = [c.strip() for c in y_input.split(',')]

            for col in y_cols:
                if col in file.columns:
                    ax.plot(file[x_col], file[col], marker='.', label=col)
                else:
                    print(f"Warning: '{col}' not found, skipping.")

        x_label = input("Enter label for X-axis (e.g., Time): ")
        x_unit = input("Enter unit for X-axis (e.g., s): ")
        y_label = input("Enter label for Y-axis (e.g., Temperature): ")
        y_unit = input("Enter unit for Y-axis (e.g., °C): ")

        ax.set_xlabel(f"{x_label} / {x_unit}")
        ax.set_ylabel(f"{y_label} / {y_unit}")

        title_text = input("Enter Title text: ")
        ax.set_title(f"{title_text}")
        ax.legend(loc='best')
        ax.grid(True, linestyle='--')

        plt.show() 
        input("Press Enter to close this graph and continue...")
        plt.close(fig)

        if input("Save this graph? (y/n): ").lower() == 'y':
            filename = input("Enter a filename: ").replace('/', '_')
            fig.savefig(filename)
            print(f"Saved to {filename}")

    print("Graphing session finished.")

load_data()
