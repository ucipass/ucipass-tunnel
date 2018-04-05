var util = require('util')
var wst = require('wstunnel');
var File = require('ucipass-file');
var sshtunnel = require('tunnel-ssh');
var wstclient = new wst.client();

function wstun(wsSourceTunnelHostPort, wsHostURL, wsDestinationTunnelHostPort){
    let resolve,reject
    let p = new Promise(function(res,rej){resolve=res,reject=rej})

    wstclient.start(wsSourceTunnelHostPort, wsHostURL, wsDestinationTunnelHostPort, function(err) {
        if (err) {
            console.log("Websocket Startup Error",err)
            reject(err)
        }else{
            console.log("WST Started");
            resolve()
        }
    });
    return p;
}

function sshtun(lhost,lport,sshhost,sshport,dhost,dport){
    let resolve,reject
    let p = new Promise(function(res,rej){resolve=res,reject=rej})
    var sshconfig = {
        keepAlive:true,
        username:sshUsername,
        password:sshPassword,
        privateKey:require('fs').readFileSync(sshKeyFile,'utf8'),
        host:sshhost, //SSH Host
        port:sshport, // SSH Host port
        localHost:lhost, //Local IP on this host
        localPort:lport,  // Local port on this host
        dstHost:dhost,  // Remote host IP
        dstPort:dport    // Remote Port
       };
        
    var server = sshtunnel(sshconfig, function (error, server) {
        if(error){
            console.log("SSH Startup error",error)
            reject(error)
        } else {
            console.log("SSH2 Started...",lhost,lport,sshhost,sshport,dhost,dport)
            resolve()
        }
    });
    
    // Use a listener to handle errors outside the callback
    server.on('error', function(err){
        console.error('SSH2 error:', err);
    });
    return p; 
}

async function run(){
    var f = new File("wstinit.json")
    try{
        var json = JSON.parse(await f.readString())
        wsHostURL = json.wsHostURL
        wsSourceTunnelHostPort = json.wsSourceTunnelHostPort
        wsDestinationTunnelHostPort = json.wsDestinationTunnelHostPort
        sshHostName = json.sshHostName
        sshHostPort = json.sshHostPort
        sshUsername = json.sshUsername
        sshPassword = json.sshPassword
        sshLocalHost = json.sshLocalHost
        sshLocalPort = json.sshLocalPort
        sshDstHost = json.sshDstHost
        sshDstPort = json.sshDstPort
        sshKeyFile = json.sshKeyFile    
    }catch(err){
        console.log("JSON file parsing error for init.json")
        process.exit()
    }

    await wstun(wsSourceTunnelHostPort, wsHostURL, wsDestinationTunnelHostPort)
    await sshtun(sshLocalHost,sshLocalPort,sshHostName,sshHostPort,sshDstHost,sshDstPort)
}

run()