################################################################################
# Makefile for deploying Montoring v5 GUIs 
#
# NOTE:  2024-07-26

################################################################################


################################################################################
# From Jon's desktop

copy_mv5-dev:
	scp real-time-dev/mv5-dev.tgz ubuntu@tools-c1.airfire.org:/home/ubuntu/Uploads
	scp real-time-dev/mv5-dev.tgz ubuntu@tools-c2.airfire.org:/home/ubuntu/Uploads
	scp real-time-dev/mv5-dev.tgz ubuntu@tools-c3.airfire.org:/home/ubuntu/Uploads

copy_mv5-ara:
	scp real-time/mv5-ara.tgz ubuntu@tools-c1.airfire.org:/home/ubuntu/Uploads
	scp real-time/mv5-ara.tgz ubuntu@tools-c2.airfire.org:/home/ubuntu/Uploads
	scp real-time/mv5-ara.tgz ubuntu@tools-c3.airfire.org:/home/ubuntu/Uploads

copy_mv5-public:
	scp real-time-public/mv5-public.tgz ubuntu@tools-c1.airfire.org:/home/ubuntu/Uploads
	scp real-time-public/mv5-public.tgz ubuntu@tools-c2.airfire.org:/home/ubuntu/Uploads
	scp real-time-public/mv5-public.tgz ubuntu@tools-c3.airfire.org:/home/ubuntu/Uploads

copy_mv5: copy_mv5-ara copy_mv5-public

################################################################################
# On AWS "tools" instances in the /var/www/html/monitoring/ directory

deploy_mv5-dev:
	sudo rm -rf v5-dev
	sudo tar -xzf /home/ubuntu/Uploads/mv5-dev.tgz 
	sudo chown -R root:root dist
	sudo mv dist v5-dev

deploy_mv5-ara:
	sudo rm -rf v5-ara
	sudo tar -xzf /home/ubuntu/Uploads/mv5-ara.tgz 
	sudo chown -R root:root dist
	sudo mv dist v5-ara

deploy_mv5-public:
	sudo rm -rf v5
	sudo tar -xzf /home/ubuntu/Uploads/mv5-public.tgz 
	sudo chown -R root:root dist
	sudo mv dist v5

deploy_mv5: deploy_mv5-ara deploy_mv-public

