jQuery(document).ready(function($) {

    var modal_submit_color_name_team = '#modal_submit_color_name_team';
    var channel,pubnub,mode,teamColor,nbrPlayers = 0,allotedTime,totleAnswers,leaderboardPlayers, leaderboardTeams = [];
    var playersList = [];
    var addToplayerList = true;
    //var listTeamsColor = [];
    var childrenEventID =[];
    var counter = 0 ;
    var headerGame = '#headerGame';
    //var startQuiz = '#start-quiz';
    var footerGame = '#footer-game';
    var quizQuestionImage = '#quiz-question-image';
    var payloadAttachment = '#payload-attachment';

    var payload;

    var correctAnswer;
    var totalCorrect = 0,totalIncorrect = 0 ,totalNotAnswered = 0, notAnswered;
    var totalStars = 0,totalLikes = 0,totalDislikes = 0,totalSmiles = 0,totalMehs = 0,totalFrowns = 0,nbrAnswersPlayers = 0;


    $('#frm_joint_animator').submit(function(){
        $('#btn_joint_animator').button('loading');
        channel = $('#game-pin').val();
        pubnub = new PubNub({
            subscribeKey: "sub-c-b5732f80-4ccf-11e6-8b3b-02ee2ddab7fe",
            publishKey: "pub-c-8e45f540-691c-4e55-9f07-f2278795ec3d",
            ssl: true,
            //uuid:'animator',
            presenceTimeout: 120,
            heartbeatInterval: 30
        });

        isOnline(channel,function(response){
            //console.log(response);

            if (response.length <= 0) {
                alert('Session not found...!');
                location.reload();
            }else{
                //console.log(response);
                $.each(response,function(index,value){
                    if(value.uuid === 'moderator'){

                        //pubnub.setUUID(nicknameStudent);

                        if(!value.state){
                            alert('Game Not in mode Team...!');
                            location.reload();
                        }else if (value.state.modeType === 'B'){
                            mode = "B";
                            //result = response;
                            var listTeamsColor = value.state.listTeamsColor;
                            $.each(listTeamsColor, function (index, value) {
                                var teamColorModerator = value.teamColor;
                                var teamNameModerator = value.teamName;
                                var nameColorModerator = value.nameColor;

                                $('#color-'+teamColorModerator).remove();
                                leaderboardTeams = classmentTeam(leaderboardTeams,teamColorModerator,nameColorModerator,teamNameModerator,0);
                                var template = addTeamClassrom(teamColorModerator,teamNameModerator);
                                $('#list_players_teams').append(template);
                            });


                            $('#frm_joint_animator').hide('200', function () {
                                $('#frm_submit_color_name_team').show(200);
                            });
                        }
                    }
                });
            }


        });
        return false;
    });




    $('#frm_submit_color_name_team').submit(function(){

        $('#btn_submit_color_name_team').button('loading');
        var teamName = $('#team-name').val();
        teamColor = $('#team-color').val();
        var nameColor = $("#team-color :selected").text();

        if(!teamName || !teamColor) return;

        pubnub.setUUID('animator');

        pubnub.addListener({
            status: function (statusEvent) {
                if (statusEvent.category === "PNConnectedCategory") {

                    $('#chat_window_1').removeClass('hidden');
                    errWrap(login);
                    $('#gamePin').text(channel);
                    $('#showPinGame').find('span').text(channel);

                    /*listTeamsColor.push({
                        teamColor : teamColor,
                        nameColor : nameColor
                    });*/
                    var newState = {
                        response  : 'changeState',
                        teamNameAnimator  : teamName,
                        teamColorAnimator : teamColor,
                        nameColorAnimator : nameColor
                    };



                    pubnub.publish(
                        {
                            message: newState,
                            channel: channel,
                            sendByPost: false // true to send via post
                        },
                        function (status, response) {
                            if (status.error) {
                                // handle error
                                console.log(status);
                                alert('error verify connection..!');
                            }else{
                                //console.log('ok'+status);
                                //stopCount();
                                $('#frm_submit_color_name_team').hide();
                                $('#dv-form').hide();
                                $(headerGame).removeClass('header-game').addClass('header-game-team');
                                $(headerGame).css('background-color', '#'+teamColor);
                                $('#header_1').append('<h2>and color <span id="teamColor">'+nameColor+'</span></h2>');
                                var template = addTeamClassrom(teamColor,teamName);
                                $('#list_players_teams').append(template);

                                $('#dv_quiz_players_team').show();
                                leaderboardTeams = classmentTeam(leaderboardTeams,teamColor,nameColor,teamName,0);

                                //console.log(leaderboardTeams);
                            }
                        }
                    );




                }
            },
            message: function (m) {
                //console.log(m.message);
                var message = m.message;
                //var response = message.response;

                switch (message.response){

                    case 'send_attachment':
                        $('#counter-slide').text(''+pad(message.slideCounter));
                        $('#total-slides').text(''+pad(message.childrenLength));
                        nbrAnswersPlayers = 0;
                        $('#nbr-answers-players').text(''+nbrAnswersPlayers);
                        payload = 'attachment';
                        $('#myBar').css('width',0);
                        countdown(5);

                        $(payloadAttachment).html('<img id="img-payload-attachment" src="'+message.slide_url+'"/>');
                        $('#title-slide').text(message.slide_title);
                        $(footerGame).addClass('text-center');
                        render_content_quiz(message.totalAnswers, message.slide_url);
                        $(quizQuestionImage).hide();
                        $(payloadAttachment).show();
                        //$(footerGame).html('<button class="next-continue btn btn-primary">Continue</button>');

                        break;

                    case 'send_quiz':

                        if (playersList.length > 0) {
                            addToplayerList = false;
                            playersList = [];
                        }

                        $('#counter-slide').text(''+pad(message.slideCounter));
                        $('#total-slides').text(''+pad(message.childrenLength));
                        nbrAnswersPlayers = 0;
                        $('#nbr-answers-players').text(''+nbrAnswersPlayers);
                        payload = 'quiz';
                        $('#myBar').css('width',0);
                        notAnswered = nbrPlayers || 0;
                        totalNotAnswered += notAnswered;
                        countdown(5);

                        $('#quiz-img').html('');
                        $('#quiz-question').html('');
                        $('#title-slide').text(message.slide_title);
                        $(footerGame).html('');
                        totleAnswers = message.totalAnswers;
                        render_content_quiz(totleAnswers, message.slide_url);
                        $(payloadAttachment).hide();
                        $(quizQuestionImage).show();

                        correctAnswer = message.correct_answer;

                        allotedTime = parseInt(message.time);

                        var contentMOdal = renderColumnChart();

                        $('#content-statistics-players').html(contentMOdal).promise().done(function(){
                            columnChart();
                            renderPercentColumnNotAnswered(notAnswered || 0);
                            //$('#item-progress-'+correctAnswer).css('background-color','#5cb85c');
                        });


                        break;

                    case 'slide_not_find':
                        alert(message.msg);
                        $(startQuiz).button('reset');
                        break;

                    case 'error_xhr':
                        alert(message.msg);
                        location.reload();
                        break;

                    case 'game_state':
                        nbrAnswersPlayers++;
                        $('#nbr-answers-players').text(''+nbrAnswersPlayers);
                        var isCorrect;
                        if(message.correct){
                            isCorrect = 1;
                            totalCorrect++;
                            notAnswered--;
                            totalNotAnswered--;

                            /*playersNotAnswered = nbrPlayers - totalCorrect;
                             notAnswered =- playersNotAnswered;*/
                            //console.log('totalCorrect : '+totalCorrect);
                        }else{
                            isCorrect = 2;
                            totalIncorrect++;
                            notAnswered--;
                            totalNotAnswered--;

                        }


                        renderPercentColumn(isCorrect);

                        renderPercentColumnNotAnswered(notAnswered);

                        leaderboardPlayers = message.leaderboardPlayers;

                        if(mode == 'B') {
                            var PtSlide = message.PtSlide || 0;
                            leaderboardTeams = classmentTeam(leaderboardTeams, message.teamColor, '', '', PtSlide);
                            //console.log(leaderboardTeams);
                        }
                        break;
                    case 'sendFeedback':
                        //console.log(message);

                        totalStars += message.starCount || 0;
                        var percentTotalStars = percentResult(totalStars,nbrPlayers,true);

                        $('#totalStars').text(''+percentTotalStars.toFixed(1));

                        if(message.thumbsType == 'like'){
                            totalLikes++;
                            var percentTotalLikes = percentResult(totalLikes,nbrPlayers);
                            $('#totalLikes').text(Math.round(percentTotalLikes)+'%');
                        }
                        if(message.thumbsType == 'dislike'){
                            totalDislikes++;
                            var percentTotalDislikes = percentResult(totalDislikes,nbrPlayers);
                            $('#totalDislikes').text(Math.round(percentTotalDislikes)+'%');
                        }

                        if(message.faceType == 'smile'){
                            totalSmiles++;
                            var percentTotalSmiles = percentResult(totalSmiles,nbrPlayers);
                            $('#totalSmiles').text(Math.round(percentTotalSmiles)+'%');
                        }
                        if(message.faceType == 'meh'){
                            totalMehs++;
                            var percentTotalMehs = percentResult(totalMehs,nbrPlayers);
                            $('#totalMehs').text(Math.round(percentTotalMehs)+'%');
                        }
                        if(message.faceType == 'frown'){
                            totalFrowns++;
                            var percentTotalFrowns = percentResult(totalFrowns,nbrPlayers);
                            $('#totalFrowns').text(Math.round(percentTotalFrowns)+'%');
                        }

                        break;


                    /*------------------------------------------------------------------------Moderator------------------------------------------------------------------------------------*/

                    case 'nextStatistics':
                        var contentModale = renderStatisticsList(leaderboardPlayers);
                        $('#content-statistics-players').html(contentModale);
                        break;

                    case 'renderStatisticsTeams':
                        var contentMOdalTeams = renderStatisticsListTeams(leaderboardTeams);
                        $('#content-statistics-players').html(contentMOdalTeams);
                        break;

                    case 'getFeedback':
                        $('#statistics-students').modal("hide");
                        $('#section-quiz').hide(function(){
                            $('#show-feedback').show();
                            $('#header_2').html('<div class="statusbar text-center"><h2>Game Over</h2></div>');
                            $('#myProgress').hide();
                            $(footerGame).hide();

                            var TotalQuestions = totalCorrect+totalIncorrect+totalNotAnswered;
                            $('#totalCorrect').text((Math.round(percentResult(totalCorrect,TotalQuestions)) || 0) +'%');
                            $('#totalIncorrect').text((Math.round(percentResult(totalIncorrect,TotalQuestions)) || 0) +'%');
                            $('#totalNotAnswered').text((Math.round(percentResult(totalNotAnswered,TotalQuestions)) || 0 )+'%');
                        });
                        break;

                    case 'dismissModal':
                        $("#statistics-students").modal('hide');
                        break;

                    case 'showStatistics':
                        $("#statistics-students").modal('show');
                        break;

                    case 'showStatisticsFeedback':
                        var contentMOdale = renderStatisticsList(leaderboardPlayers);
                        $('#content-statistics-players').html(contentMOdale);
                        $("#statistics-students").modal();
                        break;
                }
            },
            presence: function (presenceEvent) {
                //console.log(presenceEvent);

                if(presenceEvent.uuid === 'moderator'){
                    if(presenceEvent.action === 'leave'){
                        location.reload();
                    }
                    if(presenceEvent.action === 'timeout'){
                        location.reload();
                    }
                }


                if(presenceEvent.uuid !== 'animator' && presenceEvent.uuid !== 'moderator' && addToplayerList){
                    var nbrPlayersTag = '#nbr-players';
                    nbrPlayers = parseInt($(nbrPlayersTag).attr('data-id'));


                    if(presenceEvent.action === 'join'){
                        if(mode == 'A') {
                            nbrPlayers++;
                            playersList.push(presenceEvent.uuid);
                            updateNbrPlayers(nbrPlayersTag,nbrPlayers);
                            updateListPlayerModeA(playersList);
                            $(startQuiz).removeAttr('disabled');
                            //$(footerGame).hide();
                        }
                    }

                    if(presenceEvent.action === 'leave'){
                        nbrPlayers--;
                        updateNbrPlayers(nbrPlayersTag, nbrPlayers);
                        if(mode == 'A') {
                            playersList.splice($.inArray(presenceEvent.uuid, playersList), 1);
                            updateListPlayerModeA(playersList);
                        }

                        if(mode == 'B') {
                            playersList = playersList.filter(function(el) {
                                return el.nickname !== presenceEvent.uuid;
                            });
                            updateListPlayerModeB(playersList);
                        }

                    }


                    if(presenceEvent.action === 'timeout'){
                        nbrPlayers--;
                        updateNbrPlayers(nbrPlayersTag, nbrPlayers);
                        if(mode == 'A') {
                            playersList.splice($.inArray(presenceEvent.uuid, playersList), 1);
                            updateListPlayerModeA(playersList);
                        }

                        if(mode == 'B') {
                            playersList = playersList.filter(function(el) {
                                return el.nickname !== presenceEvent.uuid;
                            });
                            updateListPlayerModeB(playersList);
                        }

                    }

                    if(presenceEvent.action === 'state-change'){
                        if(mode == 'B') {
                            nbrPlayers++;
                            updateNbrPlayers(nbrPlayersTag, nbrPlayers);

                            var playerNickname = presenceEvent.uuid;
                            var colorPlayer = presenceEvent.state.teamColor;

                            playersList.push({
                                color: colorPlayer,
                                nickname: playerNickname
                            });
                            $('#content-'+colorPlayer).show();
                            updateListPlayerModeB(playersList);
                            //$(startQuiz).removeAttr('disabled');
                            //$(footerGame).hide();
                        }
                    }

                    //console.log(playersList);

                }
            }
        });

        pubnub.subscribe({
            channels: [channel],
            withPresence: true // also subscribe to presence instances.
        });
        return false;
    });



    /*--------------------------------------------------Functions----------------------------------------------*/

    function isOnline(number,cb){
        pubnub.hereNow(
            {
                channels: [number],
                includeUUIDs: true,
                includeState: true
            },
            function (status, response) {

                cb(response.channels[channel].occupants);
            }
        );
    }

    function changeViewToQuiz(){
        //$(startQuiz).button('reset');
        $('#waiting_players').hide();
        /*$("#footer-game div:first-child").hide();
         $("#footer-game div:last-child").show();*/
    }

    function get_child_event() {
        var params = {
            url: ae_globals.ajaxURL,
            type: 'post',
            data: {
                'action': 'et_site_sync',
                'method': 'get_slides_formation',
                'eventID': eventID
            },
            beforeSend: function () {},
            success: function (resp) {
                //console.log(resp);
                childrenEventID = resp;

                //console.log(childrenEventID);




            },
            complete: function () {}
        };
        $.ajax(params);
    }


    function renderPercentColumn(isCorrect){
        //var answerPlayer = message.answerPlayer;
        var itemProgress = parseInt($('#item-progress-'+isCorrect).attr('data-percent'));
        var countPlayers = parseInt($('#count-players-'+isCorrect).attr('data-count'));
        var percentColumn = percentResult(1,nbrPlayers);


        $('#item-progress-'+isCorrect).attr('data-percent', percentColumn);
        $('#count-players-'+isCorrect).attr('data-count',countPlayers+1);
        $('#count-players-'+isCorrect).text(countPlayers+1);
        $('#item-progress-'+isCorrect).css('height',itemProgress+percentColumn+'%');
    }

    function renderPercentColumnNotAnswered(playerNotAnswered){
        //var answerPlayer = message.answerPlayer;
        //var itemProgress = parseInt($('#item-progress-'+isCorrect).attr('data-percent'));
        //var countPlayers = parseInt($('#count-players-'+isCorrect).attr('data-count'));
        var percentColumn = percentResult(playerNotAnswered,nbrPlayers);

        /*$('#item-progress-3').attr('data-percent', percentColumn);*/
        //$('#count-players-3').attr('data-count',(playerNotAnswered || 0);
        //$('#countPlayersNotAnswered').val(playerNotAnswered)
        $('#count-players-3').text(''+playerNotAnswered);
        $('#item-progress-3').css('height',percentColumn+'%');


    }



    function pad(d) {
        return (d < 10) ? '0' + d.toString() : d.toString();
    }

    function render_content_quiz(totalQuestion,imgURL){
        $('#quiz-img').html('<img src="'+imgURL+'"/>');
        $('#quiz-question').html('');

        for(var i=1; i <= totalQuestion; i++){
            $('#quiz-question').append('<label id="label-question-'+i+'" class="element-animation'+i+' btn btn-lg btn-bgcolor btn-block">' +
                '<span class="btn-label"><i class="fa fa-chevron-right"></i></span> ' +
                '<input type="radio" name="q_answer" value="'+i+'">Answer '+i+'</label>');
        }
    }

    var timerId;
    function countdown(countr) {
        var count = countr;
        var numberCircle = '#numberCircle';
        //var numSlid = counter+1;
        $("#statistics-students").modal("hide");
        $('.next-continue').button('reset');
        $(numberCircle).text(''+count);
        $(numberCircle).show();
        $('#section-quiz').hide();

        $('#header_2').hide(0,function(){
            $('#header_1').html('<div class="statusbar"><h2>Prepare yourselves...</h2></div>');
            $(footerGame).hide();
        });
        $('#header_1').show();




        if(counter == 0) {
            changeViewToQuiz();
        }

        timerId = setInterval(function() {
            count--;
            //console.log(count);
            $(numberCircle).text(''+count);


            if(count == 0){
                clearInterval(timerId);
                $(numberCircle).hide();

                $('#header_1').hide(0,function(){
                    $('#header_2').show();
                    $(footerGame).show();
                });
                $('#section-quiz').show();

                if(payload === 'quiz'){
                    //console.log(allotedTime)
                    moveProgressBar(allotedTime);
                }

            }
        }, 1000);
    }



    function moveProgressBar(time) {
        var elem = document.getElementById("myBar");
        var width = 1;
        var times = time*10;
        var id = setInterval(frame, times);


        function frame() {
            if (width >= 100) {
                clearInterval(id);
                $('#label-question-'+correctAnswer).addClass('correct_answer');

                setTimeout(function(){
                    $("#statistics-students").modal();
                    $('.show-statistics').show();
                },2000);


            } else {

                width++;
                elem.style.width = width + '%';
            }
        }
    }



    function updateListPlayerModeA(arr){
        $('#list_players_teams').html('');
        $.each(arr , function(index , value){
            $('#list_players_teams').prepend('<div class="col-sm-4"><h1>' + subtractUserName(value) + '</h1></div>')
        });
    }

    function updateListPlayerModeB(arr){

        $.each(arr,function(index,value){
            var color = value.color;
            $('#list-team-players-'+color).html('');
        });

        $.each(arr,function(index,value){
            var color = value.color;
            var nickname = value.nickname;
            $('#list-team-players-'+color).append('<li>'+subtractUserName(nickname)+'</li>');
        });
    }

    function updateNbrPlayers(playersTag,nbr){
        $(playersTag).attr('data-id', '' + nbr);
        $(playersTag).text('' + nbr);
    }

    function addTeamClassrom(teamColor,teamName){
        var color = '#'+teamColor;
        return '<div id="content-'+teamColor+'" class="col-sm-6" style="display: none">' +
            '<div class="panel panel-default">' +
            '<div class="panel-heading" style="background-color: '+color+'">' +
            '<div class="row-fluid user-row">' +
            '<h2 class="color-team">'+teamName+'</h2></div></div>' +
            '<div class="panel-body text-center">' +
            '<ul id="list-team-players-'+teamColor+'" class="list-inline"></ul></div></div></div>'
    }






    function columnChart(){
        var item = $('.chart', '.column-chart').find('.item'),
            itemWidth = 100 / item.length;
        item.css('width', itemWidth + '%');

        $('.column-chart').find('.item-progress').each(function(){
            var itemProgress = $(this),
                itemProgressHeight = $(this).parent().height() * ($(this).data('percent') / 100);
            itemProgress.css('height', itemProgressHeight+'%');
        });
    }


    function renderColumnChart(){
        var items =[],result,bgColor;

        for(var i=1 ; i<= 3 ; i++){
            //var numAnswer = i+1;
            switch (i){
                case 1:
                    result = 'Correct';
                    bgColor = 'columnCorrect';
                    break;
                case 2:
                    result = 'Incorrect';
                    bgColor = 'columnIncorrect';
                    break;
                case 3:
                    result = 'Not answered';
                    bgColor = 'notAnswered';
                    break;
            }

            items.push('<div class="item">'+
                '<div class="bar">'+
                '<span class="percent">'+result+'</span>'+
                '<div id="item-progress-'+i+'" class="item-progress '+bgColor+'" data-percent="0">'+
                '<span id="count-players-'+i+'" class="title" data-count="0"></span>'+
                '</div>'+
                '</div>'+
                '</div>');
        }

        var itemsDiv = items.join("");

        return '<div class="column-chart">'+
            '<div class="chart clearfix">'+itemsDiv+'</div>'+
            '</div>';
    }


    function percentResult(answerPlayer,totalPlayers,star){
        star = star || false;
        if(!star){
            return (answerPlayer*100)/totalPlayers;
        }else{
            return answerPlayer/totalPlayers;
        }

    }




    function renderStatisticsList(leaderboard){
        var items =[],itemsContent,thContent,teamColor;
        $.each(leaderboard,function(index,value){
            var position = index+1;
            var userName = subtractUserName(value.user);
            /*if(mode == 'team') {
             itemsContent =  '<tr><td>'+position+'</td><td> user'+position+'</td><td>'+point+'</td><td><span class="label label-'+teamColor+'">Team Name</span></td></tr>'
             }else{*/

            itemsContent =  '<tr><td>'+position+'</td><td> '+userName+'</td><td>'+value.score+'</td></tr>'
            //}

            items.push(itemsContent);
        });

        var itemsDiv = items.join("");

        /*if(mode == 'team') {
         thContent =  '<div class="col-xs-12"><div class="row"><div class="col-xs-12">'+
         '<div class="main-box no-header clearfix"><div class="main-box-body clearfix">'+
         '<div class="table-responsive"><table class="table user-list table-striped">'+
         '<thead><tr><th><span>Position</span></th><th><span>User</span></th>'+
         '<th><span>Points</span></th><th><span>Team</span></th></tr></thead>'+
         '<tbody>'+itemsDiv+'</tbody></table></div></div></div></div></div></div>';
         }else{*/
        thContent =  '<div class="col-xs-12"><div class="row"><div class="col-xs-12">'+
            '<div class="main-box no-header clearfix"><div class="main-box-body clearfix">'+
            '<div class="table-responsive"><table class="table user-list table-striped">'+
            '<thead><tr><th><span>Position</span></th><th><span>User</span></th>'+
            '<th><span>Points</span></th></tr></thead>'+
            '<tbody>'+itemsDiv+'</tbody></table></div></div></div></div></div></div>';
        //}


        return thContent;
    }


    function renderStatisticsListTeams(leaderboard){
        var items =[],itemsContent,thContent,teamColor;
        $.each(leaderboard,function(index,value){
            var position = index+1;
            var backgroundColor = '#'+value.teamColor;
            /*if(mode == 'team') {
             itemsContent =  '<tr><td>'+position+'</td><td> user'+position+'</td><td>'+point+'</td><td><span class="label label-'+teamColor+'">Team Name</span></td></tr>'
             }else{*/

            itemsContent =  '<tr><td>'+position+'</td><td>'+value.teamName+'</td><td><span style="padding: 10px;color: #ffffff;background-color: '+backgroundColor+'">'+value.nameColor+'</span></td><td>'+value.score+'</td></tr>';
            //}

            items.push(itemsContent);
        });

        var itemsDiv = items.join("");

        /*if(mode == 'team') {
         thContent =  '<div class="col-xs-12"><div class="row"><div class="col-xs-12">'+
         '<div class="main-box no-header clearfix"><div class="main-box-body clearfix">'+
         '<div class="table-responsive"><table class="table user-list table-striped">'+
         '<thead><tr><th><span>Position</span></th><th><span>User</span></th>'+
         '<th><span>Points</span></th><th><span>Team</span></th></tr></thead>'+
         '<tbody>'+itemsDiv+'</tbody></table></div></div></div></div></div></div>';
         }else{*/
        thContent =  '<div class="col-xs-12"><div class="row"><div class="col-xs-12">'+
            '<div class="main-box no-header clearfix"><div class="main-box-body clearfix">'+
            '<div class="table-responsive"><table class="table user-list table-striped">'+
            '<thead><tr><th><span>Position</span></th><th><span>team name</span></th>'+
            '<th><span>team color</span></th><th><span>score</span></th></tr></thead>'+
            '<tbody>'+itemsDiv+'</tbody></table></div></div></div></div></div></div>';
        //}


        return thContent;
    }


    function subtractUserName(string){
        var arr = string.split("-");
        return arr[0];
    }


    function classmentTeam(leaderboard,teamColorp,nameColorp,teamNamep,scorep){

        var found = false;

        for(var i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].teamColor == teamColorp) {
                found = true;
                var scoreOld = leaderboard[i].score;
                var scoreFinal = Math.round(scoreOld+scorep);

                /*console.log(scoreOld);
                 console.log(scorep);
                 console.log(scoreFinal);*/

                leaderboard[i].score = scoreFinal;
                break;
            }
        }

        if(!found){
            var entryTeam = {
                teamColor: teamColorp,
                nameColor : nameColorp,
                teamName : teamNamep,
                score: scorep
            };

            leaderboard.push(entryTeam);
        }

        // resort the leaderboard based on score
        leaderboard.sort(function (a, b) {
            return (b.score - a.score);
        });

        // limit the leaderboard to 10 scores
        //var leaderboardTeam = leaderboard.slice(0, 10);

        return leaderboard.slice(0, 10);
    }



    /*-----------------------------------------videoChat------------------------------------------------------*/
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

    $('#call-video').submit(function(){
        return errWrap(makeCall,$(this));
    });


    function login(form) {
        //var gamePin = Math.floor(Math.random() * 99 + 1);
        var loginUser = "animator-" + channel;
        var phone = window.phone = PHONE({
            number: loginUser, //form.username.value || "moderator", // listen on username line else Anonymous
            publish_key: 'pub-c-561a7378-fa06-4c50-a331-5c0056d0163c', // Your Pub Key
            subscribe_key: 'sub-c-17b7db8a-3915-11e4-9868-02ee2ddab7fe', // Your Sub Key
            ssl : true
        });
        var ctrl = window.ctrl = CONTROLLER(phone);
        ctrl.ready(function () {
            /*form.username.style.background="#55ff5b";
             form.login_submit.hidden="true"; */
            ctrl.addLocalStream(vid_thumb);
            console.log("Logged in as " + loginUser);
        });
        ctrl.receive(function (session) {
            session.connected(function (session) {
                video_out.appendChild(session.video);
                session.video.setAttribute("controls","controls");
                console.log(session.number + " has joined.");
                vidCount++;
            });
            session.ended(function (session) {
                ctrl.getVideoElement(session.number).remove();
                console.log(session.number + " has left.");
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
        if (phone.number() == num) return false; // No calling yourself!
        ctrl.isOnline(num, function (isOn) {
            if (isOn) ctrl.dial(num);
            else alert("User if Offline");
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
