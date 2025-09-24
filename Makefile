################################################################################
# Makefile for deploying Monitoring v5 GUIs
#
# NOTE:  2024-07-26
################################################################################

################################################################################
# Build targets
################################################################################

build_dev:
	cd real-time-dev && npm run build_osx

build_ara:
	cd real-time-ara && npm run build_osx

build_public:
	cd real-time-public && npm run build_osx

build_co:
	cd real-time-co && npm run build_osx

build_temporary:
	cd real-time-temporary && npm run build_osx

build_pnwusfs:
	cd pnwusfs && npm run build_osx

################################################################################
# From Jon's desktop
################################################################################

scp_mv5-dev: build_dev
	scp real-time-dev/mv5-dev.tgz ubuntu@tools-c1.airfire.org:/home/ubuntu/Uploads
	scp real-time-dev/mv5-dev.tgz ubuntu@tools-c2.airfire.org:/home/ubuntu/Uploads
	scp real-time-dev/mv5-dev.tgz ubuntu@tools-c3.airfire.org:/home/ubuntu/Uploads

scp_mv5-ara: build_ara
	scp real-time-ara/mv5-ara.tgz ubuntu@tools-c1.airfire.org:/home/ubuntu/Uploads
	scp real-time-ara/mv5-ara.tgz ubuntu@tools-c2.airfire.org:/home/ubuntu/Uploads
	scp real-time-ara/mv5-ara.tgz ubuntu@tools-c3.airfire.org:/home/ubuntu/Uploads

scp_mv5-public: build_public
	scp real-time-public/mv5-public.tgz ubuntu@tools-c1.airfire.org:/home/ubuntu/Uploads
	scp real-time-public/mv5-public.tgz ubuntu@tools-c2.airfire.org:/home/ubuntu/Uploads
	scp real-time-public/mv5-public.tgz ubuntu@tools-c3.airfire.org:/home/ubuntu/Uploads

scp_mv5-co: build_co
	scp real-time-co/mv5-co.tgz ubuntu@tools-c1.airfire.org:/home/ubuntu/Uploads
	scp real-time-co/mv5-co.tgz ubuntu@tools-c2.airfire.org:/home/ubuntu/Uploads
	scp real-time-co/mv5-co.tgz ubuntu@tools-c3.airfire.org:/home/ubuntu/Uploads

scp_mv5-temporary: build_temporary
	scp real-time-temporary/mv5-temporary.tgz ubuntu@tools-c1.airfire.org:/home/ubuntu/Uploads
	scp real-time-temporary/mv5-temporary.tgz ubuntu@tools-c2.airfire.org:/home/ubuntu/Uploads
	scp real-time-temporary/mv5-temporary.tgz ubuntu@tools-c3.airfire.org:/home/ubuntu/Uploads

scp_mv5-pnwusfs: build_pnwusfs
	scp pnwusfs/mv5-pnwusfs.tgz ubuntu@tools-c1.airfire.org:/home/ubuntu/Uploads
	scp pnwusfs/mv5-pnwusfs.tgz ubuntu@tools-c2.airfire.org:/home/ubuntu/Uploads
	scp pnwusfs/mv5-pnwusfs.tgz ubuntu@tools-c3.airfire.org:/home/ubuntu/Uploads

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

