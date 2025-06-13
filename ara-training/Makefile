################################################################################
# Makefile for deploying Montoring v5 GUIs for ARA training 2025
#
# These should be deployed to ara-training.wildlandfiresmoke.net
#
# Updated 2025-06-12

################################################################################


################################################################################
# From Jon's desktop

# NOTE:  sed -i '' is OS X specific, use -i for Linux/Mac

# ----- sequence-a -------------------------------------------------------------

send_mv5-sequence-a:
	sed -i '' 's%Sequence [A-Z]%Sequence A%' src/App.svelte
	sed -i '' 's%/sequence-[a-z]%/sequence-a%' src/js/utils-purpleair.js
	sed -i '' 's%/sequence-[a-z]%/sequence-a%' src/stores/hms-data-store.js
	sed -i '' 's%/sequence-[a-z]%/sequence-a%' src/stores/monitor-data-store.js
	sed -i '' 's%/sequence-[a-z]%/sequence-a%' src/stores/purpleair-data-store.js
	npm run build_osx
	tar -czf mv5-sequence-a.tgz dist
	scp -A mv5-sequence-a.tgz ubuntu@18.246.38.38:/home/ubuntu/Uploads

# ----- sequence-b -------------------------------------------------------------

send_mv5-sequence-b:
	sed -i '' 's%Sequence [A-Z]%Sequence B%' src/App.svelte
	sed -i '' 's%/sequence-[a-z]%/sequence-b%' src/js/utils-purpleair.js
	sed -i '' 's%/sequence-[a-z]%/sequence-b%' src/stores/hms-data-store.js
	sed -i '' 's%/sequence-[a-z]%/sequence-b%' src/stores/monitor-data-store.js
	### TODO:  sed -i '' 's%/sequence-[a-z]%/sequence-b%' src/stores/purpleair-data-store.js
	npm run build_osx
	tar -czf mv5-sequence-b.tgz dist
	scp -A mv5-sequence-b.tgz ubuntu@18.246.38.38:/home/ubuntu/Uploads

# ----- sequence-c -------------------------------------------------------------

send_mv5-sequence-c:
	sed -i '' 's%Sequence [A-Z]%Sequence C%' src/App.svelte
	sed -i '' 's%/sequence-[a-z]%/sequence-c%' src/js/utils-purpleair.js
	sed -i '' 's%/sequence-[a-z]%/sequence-c%' src/stores/hms-data-store.js
	sed -i '' 's%/sequence-[a-z]%/sequence-c%' src/stores/monitor-data-store.js
	### TODO:  sed -i '' 's%/sequence-[a-z]%/sequence-c%' src/stores/purpleair-data-store.js
	npm run build_osx
	tar -czf mv5-sequence-c.tgz dist
	scp -A mv5-sequence-c.tgz ubuntu@18.246.38.38:/home/ubuntu/Uploads

# ----- all --------------------------------------------------------------------

send_all: send_mv5-sequence-a send_mv5-sequence-b send_mv5-sequence-c

