################################################################################
# Makefile for deploying Montoring v5 GUIs for ARA training 2025
#
# These should be deployed to ara-training.wildlandfiresmoke.net
#
# Updated 2025-06-12

################################################################################


################################################################################
# From Jon's desktop

build_mv5-ara-training-c:
	npm run build_osx
	tar -czf mv5-ara-training-c.tgz dist

copy_mv5-ara-training-c:
	scp mv5-ara-training-c.tgz -A ubuntu@18.246.38.38:/home/ubuntu/Uploads

################################################################################
# In the /var/www/ara-training.wildlandfiresmoke.net/ directory

deploy_mv5-ara-training-c:
	sudo rm -rf /var/www/ara-training.wildlandfiresmoke.net/v5-ara-training-c
	sudo tar -xzf /home/ubuntu/Uploads/mv5-ara-training-c.tgz -C /var/www/ara-training.wildlandfiresmoke.net
	sudo chown -R root:root /var/www/ara-training.wildlandfiresmoke.net/dist
	sudo mv /var/www/ara-training.wildlandfiresmoke.net/dist /var/www/ara-training.wildlandfiresmoke.net/v5-ara-training-c


