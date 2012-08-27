Introduction
============

PloneIDE is an IDE intended to make Plone development faster and easier. It runs on top of Plone as a third party product, so it runs inside the browser. For this, it uses `Ace`_, the editor used in the Ajax.org's `Cloud9 IDE`_.

I bet i lost some of you when i mentioned the fact that you will be coding inside the browser, but give it a try. It's amazingly fast, so you'll forget you're inside a browser.

Also, the fact that this runs on top of Plone, allows the IDE to be contextual and aware of where it was opened. You just need to add "/@@ploneide" to wherever you are in your site, and the IDE will be opened in that context. Furthermore, we get access to live code. More on this later.

Current Features
================

To get an idea of what is already there, checkout this video, i recommend watching it in HD and fullscreen.

http://vimeo.com/30446168 


Basic editing
-------------

The Ace editor is a 100% Javascript editor, capable of doing what most "desktop editors" are capable of:

* Change font size
* Syntax Highlight
* Auto indent
* Block commenting
* Braces matching
* Syntax check
* Undo / Redo
* Vertical and Horizontal splitting
* Find text
* Search and replace
* Goto Line
* More... 

Session Management
------------------

One of the main features of the IDE, is the use of `HTML 5 localStorage`_. The IDE automatically stores currently opened files into a "session", so, from the Session Management panel, you can switch between them, add new ones, rename and delete them. Furthermore, this localStorage persists after closing and opening the browser, so you will resume your session as it was, even if you close and reopen the browser, tab, etc.

plone.reload and collective.developermanual
-------------------------------------------

The IDE has integration with the plone.reload product. This allows to reload code directly from the IDE, without the need to go to the console and restart the instance. It also has the possibility to restart Plone altogether, in the case plone.reload does not work.

collective.developermanual is also part of the IDE, for times when you have no internet, and need to find help.

Contextual information
----------------------

This is one of the most powerful features. Since this is a contextual IDE, it knows where it was opened, so, from the contextual panel, you can get all sorts of information regarding the current object, and also, actions:

* Portal type
* Meta type
* Open the file where the class for this object is defined
* List of provided interfaces
* All schema fields for the current object
* Open the file, and go to the line number, where the widget or field is defined
* Which workflow policy is being used for this object
* Open the workflow definition in the ZMI in a new browser tab
* List of available views
* Open the template files where these views are defined.
* Open the python file for the view class, if this is a z3view 

Those are the options already implemented, but the list could be endless.

Debugging
---------

I left the best part to the end. Ever wanted that functionality most popular IDE's (like Eclipse or Netbeans) have, where you just click the line number to place a breakpoint and then the IDE accomodates itself showing all sorts of debugging information ? well, PloneIDE has it :)

Just enable debugging from the debugging panel, place a breakpoint in some python code, create a request that will fire up that code, and voilà.

You get a local and global scope boxes, and a watched variables box. These will show, painted in orange, variables that have changed since last step. Also, you get an orange line in the editor, showing the active line. As execution continues, perhaps the active line is in a separate file, well, PloneIDE will automatically open the file for you. Also, there's a console in the lower part, where you can just enter code to check the output. Finally, you have buttons on each of the commands you entered in the console, to add the command to the editor, or the watched variables box.

Getting the code
================

The code is currently in the Plone Collective SVN repo:

http://svn.plone.org/svn/collective/collective.ploneide/

http://svn.plone.org/svn/collective/collective.recipe.ploneide/

Installing
==========

There's a buildout for your convenience in http://svn.plone.org/svn/collective/collective.ploneide/buildout that has everything needed to have PloneIDE installed.

Buildout
--------

If you're using buildout, the following steps should be enough:

1. Have collective.ploneide and collective.recipe.ploneide available inside your src/ directory (preferably using mr.developer)
2. Add collective.ploneide to your instance eggs list
3. Create a new "ploneide" section with::

     [ploneide]
     recipe = collective.recipe.ploneide

4. Re-run buildout 

Eventually, this process will be replaced to using just the recipe.

Opening the IDE
===============

You need to start the instance using "./bin/ploneide". This is needed because PloneIDE needs an auxiliar HTTP server to be started. In addition to this, the debugger uses a second HTTP server to be able to receive commands, so bear in mind that you need 2 ports to be available, 8081 and 8082. These port numbers will be customizable from the recipe. Once the instance is up, just go to your Plone site, and add "/@@ploneide" to the URL

Basic usage
===========

To open files, just use the file tree in the right panel (at the moment, only eggs from the src directory are listed here). There's a legacy second file tree beneath the javascript one, that list all eggs from the PYTHONPATH, from here you can open any file from the current buildout.

To save the file, just click the floppy shaped icon, or hit "Ctrl + S" in your keyboard. At the moment, you get no feedback to be sure that the file was actually saved.

There's a `known bug`_ in the split view, where, one of the editors gets corrupted data, and causes that when hiting "Ctrl + S" a "save file" dialog from the browser appears.

Contributing
============

This is a work in progress, and it is just taking it first steps into the world. It is in a pre-alpha stage, with a lot of features still missing, and a lot of bugs. If you can see the potential of this project, and would like to help, anything you do is useful: submitting tickets to the tracker (`here`_), commiting code in the repo (if you have access to collective), etc.

Or just contact me.

Acknowledgements
================

Special thanks to `Menttes`_ (the company i used to work for) for the support, and for letting me assign some of my time to this. 


.. _Ace: https://github.com/ajaxorg/ace

.. _Cloud9 IDE: http://cloud9ide.com/

.. _http://vimeo.com/30446168: http://vimeo.com/30446168

.. _HTML 5 localStorage: http://dev.w3.org/html5/webstorage/#the-localstorage-attribute

.. _http://svn.plone.org/svn/collective/collective.ploneide/: http://svn.plone.org/svn/collective/collective.ploneide/

.. _http://svn.plone.org/svn/collective/collective.recipe.ploneide/: http://svn.plone.org/svn/collective/collective.recipe.ploneide/

.. _http://svn.plone.org/svn/collective/collective.ploneide/buildout: http://svn.plone.org/svn/collective/collective.ploneide/buildout

.. _known bug: http://code.google.com/p/ploneide/issues/detail?id=2

.. _here: http://code.google.com/p/ploneide/issues/list

.. _Menttes: http://www.menttes.com/

