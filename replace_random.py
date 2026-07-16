import os
import re

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            original_content = content
            
            # Replace various Math.random() patterns used for IDs
            content = re.sub(r'Math\.random\(\)\.toString\(36\)\.substring\([^\)]+\)', 'crypto.randomUUID().slice(0, 8)', content)
            content = re.sub(r'Math\.random\(\)\.toString\(36\)\.substr\([^\)]+\)', 'crypto.randomUUID().slice(0, 8)', content)
            content = re.sub(r'Math\.floor\(\s*Math\.random\(\)\s*\*\s*\d+\s*\)', 'parseInt(crypto.randomUUID().slice(0, 4), 16)', content)
            content = re.sub(r'Math\.floor\(\s*\d+\s*\+\s*Math\.random\(\)\s*\*\s*\d+\s*\)', 'parseInt(crypto.randomUUID().slice(0, 4), 16)', content)
            content = re.sub(r'Math\.random\(\)', '0.5', content) # fallback for remaining

            if content != original_content:
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Updated {filepath}")
