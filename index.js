var util = require('util')
var wst = require('wstunnel');
var sshtunnel = require('tunnel-ssh');
var readlineSync = require('readline-sync');
var File = require('ucipass-file');

function wstun(wsSourceTunnelHostPort, wsHostURL, wsDestinationTunnelHostPort){
    let resolve,reject
    let p = new Promise(function(res,rej){resolve=res,reject=rej})
    let wstclient = new wst.client();

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

async function sshtun(lhost,lport,sshhost,sshport,sshKeyFile,sshPassword,dhost,dport){
    let resolve,reject
    let p = new Promise(function(res,rej){resolve=res,reject=rej})
    var sshconfig = {
        keepAlive:true,
        username:sshUsername,
        host:sshhost, //SSH Host
        port:sshport, // SSH Host port
        localHost:lhost, //Local IP on this host
        localPort:lport,  // Local port on this host
        dstHost:dhost,  // Remote host IP
        dstPort:dport    // Remote Port
       };

    let fkey = new File(sshKeyFile)
    if(await fkey.isFile()){
        console.log("Using SSH Private Key File:",sshKeyFile)
        sshconfig.privateKey = require('fs').readFileSync(sshKeyFile,'utf8')
    }else{
        console.log("No SSH Private Key File:",sshKeyFile,"Using password...")
        sshconfig.password = sshPassword
    }
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
    var finit = new File("wstinit.json")
    if(!await finit.isFile()){
        let ftemplate = new File("wsttemplate.json")
        let s = await ftemplate.readString()
        let json = JSON.parse(s)
        for(var j in json){
            console.log("Current value for "+j+":",json[j])
             let input = readlineSync.question('Enter value for '+j+': ') 
             json[j] = input == "" ? json[j] : input
        }
        console.log(json)
        await finit.writeString(JSON.stringify(json, null, 2))
    }

    try{
        var json = JSON.parse(await finit.readString())
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
    await sshtun(sshLocalHost,sshLocalPort,sshHostName,sshHostPort,sshKeyFile,sshPassword,sshDstHost,sshDstPort)
}

run()