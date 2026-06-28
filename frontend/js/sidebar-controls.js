
function toggleBotDesdeSidebar(estado){
    const ids=["botSwitch","botSwitchConfig"];
    ids.forEach(id=>{const el=document.getElementById(id);if(el){el.checked=estado;}});
    if(typeof toggleBot==="function"){toggleBot(estado);return;}
    if(typeof actualizarEstadoBot==="function"){actualizarEstadoBot(estado);return;}
}
document.addEventListener("DOMContentLoaded",function(){
    const sidebarSwitch=document.getElementById("botSwitchSidebar");
    const mainSwitch=document.getElementById("botSwitch");
    if(sidebarSwitch && mainSwitch){sidebarSwitch.checked=mainSwitch.checked;}
});
