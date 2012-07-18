#!/bin/sh

# Requirements: node.js

#TODO: Find a way to build specific plugins for ace
#At the moment, just add the following (After "ace themes"
#section in the Makefile.dryice.js file line 236 aprox
#to build split plugin

#console.log('# ace split ---------');
#copy({
#    source: [{
#        root: aceHome + '/lib',
#        include: "ace/split.js"
#    }],
#    filter: modeThemeFilters,
#    dest:   targetDir + "/src/split.js"
#});

# Get and update (if already had it) Dryice
git clone https://github.com/mozilla/dryice.git
cd dryice
git pull
cd ..

# Get and update (if already had it) UglyfyJS
git clone https://github.com/mishoo/UglifyJS.git
cd UglifyJS
git pull
cd ..

# Copy libs to a path where node.js will find them
# should rework this to modify the libs path instead
mkdir -p ~/.node_modules/
cp -R dryice/lib/dryice/ ~/.node_modules/
cp -R UglifyJS/* ~/.node_modules/

# Get the latest ace 
git clone git://github.com/ajaxorg/ace.git
cd ace
git submodule update --init --recursive

# Clean what's compiled and re-compile
make clean
make
cd ..

# Copy needed .js files to the proper folder
# for some reason, the following line does not work
#cp ace/build/src/{ace.js,cockpit.js,mode-css.js,mode-html.js,mode-javascript.js,mode-python.js,mode-xml.js,theme-clouds.js,theme-clouds_midnight.js,theme-cobalt.js,theme-dawn.js,theme-eclipse.js,theme-idle_fingers.js,theme-kr_theme.js,theme-merbivore.js,theme-merbivore_soft.js,theme-mono_industrial.js,theme-monokai.js,theme-pastel_on_dark.js,theme-twilight.js,theme-vibrant_ink.js,worker-coffee.js,worker-javascript.js}  browser/ace

##### START COPY ######
cp ace/build/src/ace.js browser/ace
cp ace/build/src/cockpit.js browser/ace
cp ace/build/src/mode-css.js browser/ace
cp ace/build/src/mode-html.js browser/ace
cp ace/build/src/mode-javascript.js browser/ace
cp ace/build/src/mode-python.js browser/ace 
cp ace/build/src/mode-xml.js browser/ace
cp ace/build/src/theme-clouds.js browser/ace
cp ace/build/src/theme-clouds_midnight.js browser/ace
cp ace/build/src/theme-cobalt.js browser/ace
cp ace/build/src/theme-dawn.js browser/ace
cp ace/build/src/theme-eclipse.js browser/ace
cp ace/build/src/theme-idle_fingers.js browser/ace
cp ace/build/src/theme-kr_theme.js browser/ace
cp ace/build/src/theme-merbivore.js browser/ace
cp ace/build/src/theme-merbivore_soft.js browser/ace
cp ace/build/src/theme-mono_industrial.js browser/ace
cp ace/build/src/theme-monokai.js browser/ace
cp ace/build/src/theme-pastel_on_dark.js browser/ace
cp ace/build/src/theme-twilight.js browser/ace
cp ace/build/src/theme-vibrant_ink.js browser/ace
cp ace/build/src/worker-coffee.js browser/ace
cp ace/build/src/worker-javascript.js browser/ace

####### DONE WITH COPY ###########



#cd BespinEmbedded-0.9a2/
#python dryice.py ../manifest.json
#cd .. 

#grep -R "resources/" out/ --exclude-dir=*.svn | while read i; do
#FILE=$(echo $i |  cut -d ":" -f1)

#sed "s/resources\//++resource++collective.ploneide.bespin\/resources\//g" $FILE -i
#done

#grep -R "BespinEmbedded.js" out/ --exclude-dir=*.svn | while read i; do
#FILE=$(echo $i |  cut -d ":" -f1)

#sed "s/BespinEmbedded.js/++resource++collective.ploneide.bespin\/BespinEmbedded.js/g" $FILE -i
#done


#cp out/* browser/bespin/
