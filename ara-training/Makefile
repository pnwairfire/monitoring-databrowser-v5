################################################################################
# Makefile for deploying Montoring v5 GUIs for ARA training 2025
#
# These should be deployed to ara-training.wildlandfiresmoke.net
#
# Updated 2025-06-12

################################################################################


################################################################################
# From Jon's desktop

# ----- sequence-a ------------------------------------------------------------

build_mv5-sequence-a:
	npm run build_osx
	tar -czf mv5-sequence-a.tgz dist

copy_mv5-sequence-a:
	scp -A mv5-sequence-a.tgz ubuntu@18.246.38.38:/home/ubuntu/Uploads

send_mv5-sequence-a: build_mv5-sequence-a copy_mv5-sequence-a

# ----- sequence-b ------------------------------------------------------------

build_mv5-sequence-b:
	npm run build_osx
	tar -czf mv5-sequence-b.tgz dist

copy_mv5-sequence-b:
	scp -A mv5-sequence-b.tgz ubuntu@18.246.38.38:/home/ubuntu/Uploads

send_mv5-sequence-b: build_mv5-sequence-b copy_mv5-sequence-b

# ----- sequence-c ------------------------------------------------------------

build_mv5-sequence-c:
	npm run build_osx
	tar -czf mv5-sequence-c.tgz dist

copy_mv5-sequence-c:
	scp -A mv5-sequence-c.tgz ubuntu@18.246.38.38:/home/ubuntu/Uploads

send_mv5-sequence-c: build_mv5-sequence-c copy_mv5-sequence-c

