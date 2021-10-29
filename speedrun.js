//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//!DO NOT MODIFY THIS FILE IN ANY WAY
//!OVERWRITING THIS FILE WILL CAUSE YOUR SPEEDRUN TO BE INVALIDATED
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!



//Function wrapper to prevent global namespace pollution
(()=>{
function main() {

    //Get game runtime
    let old = globalThis.sdk_runtime;
    c2_callFunction("execCode", ["globalThis.sdk_runtime = this.runtime"]);
    let runtime = globalThis.sdk_runtime;
    globalThis.sdk_runtime = old;

    //Send a notification
    function notify(text, title = "lvnaMod Speedrun Tools", image = "./speedrunner.png") {
        cr.plugins_.sirg_notifications.prototype.acts.AddSimpleNotification.call(
            runtime.types_by_index.find(
                (type) => type.plugin instanceof cr.plugins_.sirg_notifications
            ).instances[0],
            title,
            text,
            image
        );
    };

    runtime.isMobile = true;

    var currentdate = new Date(); 
    var datetime = currentdate.getDate() + "/"
        + (currentdate.getMonth()+1)  + "/" 
        + currentdate.getFullYear() + " @ "  
        + currentdate.getHours() + ":"  
        + currentdate.getMinutes() + ":" 
        + currentdate.getSeconds();
    //Notify Load
    notify(`Speedrun tools have been loaded. It is currently ${datetime}`)
//End main function
}

//Check for game load every 5s
let interval = setInterval(() => {
    //If construct is loaded and callfunction is defined
    if (c2_callFunction) {
        //If game runtime is created
        let old = globalThis.sdk_runtime;
        c2_callFunction("execCode", ["globalThis.sdk_runtime = this.runtime"]);
        let runtimetest = globalThis.sdk_runtime;
        globalThis.sdk_runtime = old;
        if(runtimetest) {
            //Stop the loop and start main loader
            clearInterval(interval)
            main()
        }
    }
}, 5000);

//End wrapper
})();