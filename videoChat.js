 /*-----------------------------------------videoChat------------------------------------------------------*/
jQuery(document).ready(function($) {
    var video_out = document.getElementById("vid-box");
    var vid_thumb = document.getElementById("vid-thumb");
    var vidCount = 0;





    $(document).on('click', '.panel-heading span.icon_minim', function (e) {
        var $this = $(this);

        if (!$this.hasClass('panel-collapsed')) {
            $this.parents('.panel').find('.panel-body').slideDown();
            $this.addClass('panel-collapsed');
            $this.removeClass('fa-plus').addClass('fa-minus');
        } else {

            $this.parents('.panel').find('.panel-body').slideUp();
            $this.removeClass('panel-collapsed');
            $this.removeClass('fa-minus').addClass('fa-plus');
        }
    });


    $('#mute-video').click(function(){
        mute();
    });
    $('#pause-video').click(function(){
        pause();
    });
    $('#end-video').click(function(){
        end();
    });

    /*$('#call-video').submit(function(){
        return errWrap(makeCall,$(this));
    });*/

    $(document).on('click', '#loginChat', function (event) {
        var currentBtn = $(event.currentTarget);
        $(currentBtn).button('loading');
        return errWrap(login);
    });

    $(document).on('click', '.loginChat', function (event) {
        var currentBtn = $(event.currentTarget);
        $(currentBtn).button('loading');
        return errWrap(makeCall);
    });


    function login(form) {
        //var gamePin = Math.floor(Math.random() * 99 + 1);
        var loginUser = "animator-" + channel;
        var phone = window.phone = PHONE({
            number: loginUser, //form.username.value || "moderator", // listen on username line else Anonymous
            publish_key: publishKey, // Your Pub Key
            subscribe_key: subscribeKey, // Your Sub Key
            ssl : true
        });
        var ctrl = window.ctrl = CONTROLLER(phone);
        ctrl.ready(function () {
            /*form.username.style.background="#55ff5b";
             form.login_submit.hidden="true"; */
            ctrl.addLocalStream(vid_thumb);

            errWrap(makeCall);

            //console.log("Logged in as " + loginUser);
        });
        ctrl.receive(function (session) {
            session.connected(function (session) {
                session.video.setAttribute("controls","");
                //video_out.appendChild(session.video);
                //video_out.replaceChild(session.video, video_out.firstChild);
                video_out.innerHTML = '';
                video_out.appendChild(session.video);
                //alert(session.number + " has joined.");
                vidCount++;

                /*$('#chat_window_1').removeClass('hidden');
                $('#loginChat').hide();
                $('#loginChat').button('reset');*/
            });
            session.ended(function (session) {
                ctrl.getVideoElement(session.number).remove();
                //alert(session.number + " has left.");
                vidCount--;
            });
        });
        ctrl.videoToggled(function (session, isEnabled) {
            ctrl.getVideoElement(session.number).toggle(isEnabled);
            console.log(session.number + ": video enabled - " + isEnabled);
        });
        ctrl.audioToggled(function (session, isEnabled) {
            ctrl.getVideoElement(session.number).css("opacity", isEnabled ? 1 : 0.75);
            console.log(session.number + ": audio enabled - " + isEnabled);
        });
        return false;
    }

    function makeCall() {
        if (!window.phone) alert("Login First!");
        var num = 'moderator-'+channel;
         console.log(num);
        if (phone.number() == num) return false; // No calling yourself!
        ctrl.isOnline(num, function (isOn) {
            if (isOn) {
                ctrl.dial(num);
            }
            else {
                alert("User if Offline!! Please wait for the Moderator connected");
            }

            $('#loginChat').hide('100',function(){

                $('#chat_window_1').removeClass('hidden');
                $('.loginChat').button('reset');
                $('.panel-heading span.icon_minim').parents('.panel').find('.panel-body').slideDown();
                $('.panel-heading span.icon_minim').addClass('panel-collapsed');
                $('.panel-heading span.icon_minim').removeClass('fa-plus').addClass('fa-minus');

            });

        });
        return false;
    }

    function mute() {
        var audio = ctrl.toggleAudio();
        if (!audio) $("#mute-video").html('<i class="fa fa-volume-up icon_video_action"></i>');
        else $("#mute-video").html('<i class="fa fa-volume-off icon_video_action"></i>');
    }

    function end() {
        ctrl.hangup();
    }

    function pause() {
        var video = ctrl.toggleVideo();
        if (!video) $('#pause-video').html('<i class="fa fa-play icon_video_action"></i>');
        else $('#pause-video').html('<i class="fa fa-pause icon_video_action"></i>');
    }

    function getVideo(number) {
        return $('*[data-number="' + number + '"]');
    }


    function errWrap(fxn, form) {
        try {
            return fxn(form);
        } catch (err) {
            alert("WebRTC is currently only supported by Chrome, Opera, and Firefox");
            return false;
        }
    }

});