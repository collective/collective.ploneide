# -*- coding: utf-8 -*-

from setuptools import setup, find_packages
import os

version = '0.1'

description = "Integrated Development Environment for Plone."
long_description = open("README.txt").read() + "\n" + \
                   open(os.path.join("docs", "INSTALL.txt")).read() + "\n" + \
                   open(os.path.join("docs", "CREDITS.txt")).read() + "\n" + \
                   open(os.path.join("docs", "HISTORY.txt")).read()

setup(name='collective.ploneide',
      version=version,
      description=description,
      long_description=long_description,
      # Get more strings from
      # http://pypi.python.org/pypi?%3Aaction=list_classifiers
      classifiers=[
        "Framework :: Plone",
        "Programming Language :: Python",
        ],
      keywords='Integrated Development Environment, Plone, IDE',
      author='Franco Pellegrini',
      author_email='frapell@gmail.com',
      url='http://svn.plone.org/svn/collective/collective.ploneide/',
      license='GPL',
      packages=find_packages('src'),
      package_dir={'': 'src'},
      namespace_packages=['collective'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          # -*- Extra requirements: -*-
          'rope',
          'pep8',
          'pyflakes',
          'sauna.reload',
          'TornadIO',
          'ordereddict',
      ],
      extras_require={
        'test': ['plone.app.testing'],
        },
      entry_points="""
      # -*- Entry points: -*-

      [z3c.autoinclude.plugin]
      target = plone
      """,
      )
