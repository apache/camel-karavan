set -e

if [ "$#" -lt 1 ]; then
    echo "usage: $0 version"
    exit 1
fi

location=$(dirname $0)
version=$1

mkdir $1/
cd $1/

wget https://dist.apache.org/repos/dist/dev/camel/camel-karavan/$1/camel-karavan-$1.zip 
wget https://dist.apache.org/repos/dist/dev/camel/camel-karavan/$1/camel-karavan-$1.zip.asc 
wget https://dist.apache.org/repos/dist/dev/camel/camel-karavan/$1/camel-karavan-$1.zip.sha512
cd ../
svn import $1/ https://dist.apache.org/repos/dist/release/camel/camel-karavan/$1/ -m "Import camel-karavan release"

rm -rf $1/