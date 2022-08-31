usage() {
	echo "usage: $(basename $0) -c channel -d distributionID" >&2
	echo "  -c      Channel name (dev, next, latest) or semver" >&2
	echo "  -d      CloudFront Distribution ID" >&2
}

while getopts c:d: flag
do
	case "${flag}" in
		c)
			channel=${OPTARG}
			;;
		d)
			distributionID=${OPTARG}
			;;
		*)
			usage
			exit 1
			;;
	esac
done

if [ -z "$channel" ] || [ -z "$distributionID" ]; then
	usage
	exit 1
fi

aws s3 cp ./dist "s3://evolv-execution-plan-binaries/javascript-sdk/releases/${channel}" --recursive --acl public-read
aws cloudfront create-invalidation --distribution-id "${distributionID}" --paths "/javascript-sdk/releases/${channel}/*"
