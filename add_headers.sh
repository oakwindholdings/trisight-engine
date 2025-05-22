#!/bin/bash
for file in $(find src -name '*.ts' -o -name '*.tsx'); do
  if ! head -n 3 "$file" | grep -q "// src/"; then
    echo "// $file" > "$file.tmp"
    echo "// TODO: Add file description" >> "$file.tmp"
    echo "// TODO: Add additional context" >> "$file.tmp"
    cat "$file" >> "$file.tmp"
    mv "$file.tmp" "$file"
    echo "Added header to $file"
  fi
done
