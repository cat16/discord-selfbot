@echo off

echo adding files...

git add *.js
git add README.md

echo files added.

echo enter a commit message:

set /p msg=

echo commiting...

git commit -m "%msg%"

echo committed with message '%msg%'

echo pushing commit...

git push -u origin master

echo pushed commit.

echo done!

set /p z=