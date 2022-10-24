#! /bin/sh

set -e

name=test-repo

remote=https://github.com/milahu/prosemirror-inplace-editing-demo-test-repo

script="$(readlink -f "$0")"
srcdir="$(readlink -f $(dirname "$0"))"
license="$srcdir/license.txt"

mkdir $name

pushd $name

git init

cp $license license.txt
git add license.txt

cat >readme.md <<'EOF'
this is a test repo for
https://github.com/milahu/prosemirror-inplace-editing-demo

it was generated with [make-test-repo.sh](make-test-repo.sh)
EOF
git add readme.md
git commit -m init

cp "$script" make-test-repo.sh
git add make-test-repo.sh
git commit -m "add make-test-repo.sh"

for f in file1 file2
do

for i in $(seq 0 10)
do
echo $i >>$f
git add $f
git commit -m "up $f"
done

done

git remote add origin $remote
git push origin -u main -f
