#!/bin/bash

directoryPath="......."  # 替换为你的文件夹路径

for file in "$directoryPath"/*
do
  if grep -q 'username=' "$file"; then
    username=$(grep -o 'username=[^&]*' "$file" | sed 's/username=//')
    mv "$file" "${directoryPath}/${username}.svg"
  fi
done