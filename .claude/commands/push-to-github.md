Push these changes to GitHub: $ARGUMENTS.

If no topic provided, just document the recent changes.  
If a topic is provided, focus on documenting that topic.

Follow these steps:

1. run `git status` to get the current branch name  
2. run `git add .` to stage all files (unless the user says otherwise)  
3. run `git commit -m "commit message"` to commit changes  
   (make the message very concise yet complete, do not give yourself credit)  
4. run `git push origin <branch name>` to push changes to GitHub

## Important Rules:
- FOLLOW THIS EXACT ORDER. EACH STEP IS A SEPARATE TERMINAL.
- commit messages cannot contain newline characters
- never just do `git commit`. always include a commit message
- keep commit messages concise, while still clearly describing the changes
- if the user mentions a specific issue number, include it in the commit message
