from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in customizations_newjaisa/__init__.py
from customizations_newjaisa import __version__ as version

setup(
	name="customizations_newjaisa",
	version=version,
	description="all customizations and api",
	author="samuvel and tech team newjaisa ",
	author_email="itsuport@newjaisa.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
