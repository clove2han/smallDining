filelist=`find /usr/local/smallDining -name '*.js'`;
echo $filelist;
for i in $filelist;
do
echo $i;
#len=${#i};
#echo $len;
#tmp1=${i:0:len-3};
#tmp2="$tmp1-min.js";
#echo $tmp2;
uglifyjs $i -o $i;
done
