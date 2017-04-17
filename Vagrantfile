# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = '2'

@script = <<SCRIPT
# Fix for https://bugs.launchpad.net/ubuntu/+source/livecd-rootfs/+bug/1561250
if ! grep -q "ubuntu-xenial" /etc/hosts; then
    echo "127.0.0.1 ubuntu-xenial" >> /etc/hosts
fi

# Set timezone and update date
timedatectl set-timezone Europe/Warsaw
ntpdate ntp.ubuntu.com

# Reset home directory of vagrant user
if ! grep -q "cd /var/www" /home/ubuntu/.profile; then
    echo "cd /var/www" >> /home/ubuntu/.profile
fi

# Install dependencies
add-apt-repository ppa:ondrej/php
apt-get update

# Install PHP
apt-get install -y php7.1 php7.1-bcmath php7.1-bz2 php7.1-cli php7.1-curl php7.1-intl php7.1-json php7.1-mbstring php7.1-opcache php7.1-soap php7.1-sqlite3 php7.1-xml php7.1-xsl php7.1-zip php7.1-mysql php7.1-pgsql php7.1-mcrypt php-amqp

# Install node v4 and NPM package manager
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt-get install -y nodejs npm
cd /var/www
npm install

# Install Composer and resolve its dependencies
if [ -e /usr/local/bin/composer ]; then
    /usr/local/bin/composer self-update
else
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi
cd /var/www/php-consumer
composer update

# Install RabbitMQ
apt-get install -y rabbitmq-server
rabbitmq-plugins enable rabbitmq_management
service rabbitmq-server restart
curl http://localhost:15672/cli/rabbitmqadmin > /usr/local/bin/rabbitmqadmin

echo "** Visit http://localhost:15672 in your browser for view rabbitmq management console **"
SCRIPT

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
    config.vm.box = 'ubuntu/trusty64'
    config.vm.network "forwarded_port", guest: 5672, host: 5672, id: "rabbitmq", host_ip: "localhost", auto_correct: true
    config.vm.network "forwarded_port", guest: 15672, host: 15672, id: "rabbitmq-management", host_ip: "localhost", auto_correct: true
    config.vm.synced_folder '.', '/var/www', nfs: true
    config.vm.provision 'shell', inline: @script

    config.vm.provider "virtualbox" do |vb|
        vb.customize ["modifyvm", :id, "--cpus", "1"]

        host = RbConfig::CONFIG['host_os']

        # Give VM 1/4 system memory
        if host =~ /darwin/
            # sysctl returns Bytes and we need to convert to MB
            mem = `sysctl -n hw.memsize`.to_i / 1024
        elsif host =~ /linux/
            # meminfo shows KB and we need to convert to MB
            mem = `grep 'MemTotal' /proc/meminfo | sed -e 's/MemTotal://' -e 's/ kB//'`.to_i
        elsif host =~ /mswin|mingw|cygwin/
            # Windows code via https://github.com/rdsubhas/vagrant-faster
            mem = `wmic computersystem Get TotalPhysicalMemory`.split[1].to_i / 1024
        end

        mem = mem / 1024 / 4
        vb.customize ["modifyvm", :id, "--memory", mem]
    end
end
