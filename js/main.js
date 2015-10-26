jQuery(document).ready(function ($) {
    var title = 'Obecto те предизвиква: Колко бири Програмистко може да изпиеш и все още да можеш да кодиш';
    var url = 'http://www.obecto.com/careers/';
    var obj = {Title: title, Url: url};
    history.pushState(obj, obj.Title, obj.Url);

    //variables
    var hijacking = $('body').data('hijacking'),
            animationType = $('body').data('animation'),
            delta = 0,
            scrollThreshold = 5,
            actual = 1,
            animating = false;

    //DOM elements
    var sectionsAvailable = $('.cd-section'),
            verticalNav = $('.cd-vertical-nav'),
            prevArrow = verticalNav.find('a.cd-prev'),
            nextArrow = verticalNav.find('a.cd-next');


    //check the media query and bind corresponding events
    var MQ = deviceType(),
            bindToggle = false;

    bindEvents(MQ, true);

    $(window).on('resize', function () {
        MQ = deviceType();
        bindEvents(MQ, bindToggle);
        if (MQ == 'mobile')
            bindToggle = true;
        if (MQ == 'desktop')
            bindToggle = false;
    });

    function bindEvents(MQ, bool) {
        if (MQ == 'desktop' && bool) {
            //bind the animation to the window scroll event, arrows click and keyboard
            if (hijacking == 'on') {
                initHijacking();
                $(window).on('DOMMouseScroll mousewheel', scrollHijacking);
            } else {
                scrollAnimation();
                $(window).on('scroll', scrollAnimation);
            }
            prevArrow.on('click', prevSection);
            nextArrow.on('click', nextSection);

            $(document).on('keydown', function (event) {
                if (event.which == '40' && !nextArrow.hasClass('inactive')) {
                    event.preventDefault();
                    nextSection();
                } else if (event.which == '38' && (!prevArrow.hasClass('inactive') || (prevArrow.hasClass('inactive') && $(window).scrollTop() != sectionsAvailable.eq(0).offset().top))) {
                    event.preventDefault();
                    prevSection();
                }
            });
            //set navigation arrows visibility
            checkNavigation();
        } else if (MQ == 'mobile') {
            //reset and unbind
            resetSectionStyle();
            $(window).off('DOMMouseScroll mousewheel', scrollHijacking);
            $(window).off('scroll', scrollAnimation);
            prevArrow.off('click', prevSection);
            nextArrow.off('click', nextSection);
            $(document).off('keydown');
        }
    }

    function scrollAnimation() {
        //normal scroll - use requestAnimationFrame (if defined) to optimize performance
        (!window.requestAnimationFrame) ? animateSection() : window.requestAnimationFrame(animateSection);
    }

    function animateSection() {
        var scrollTop = $(window).scrollTop(),
                windowHeight = $(window).height(),
                windowWidth = $(window).width();

        sectionsAvailable.each(function () {
            var actualBlock = $(this),
                    offset = scrollTop - actualBlock.offset().top;

            //according to animation type and window scroll, define animation parameters
            var animationValues = setSectionAnimation(offset, windowHeight, animationType);

            transformSection(actualBlock.children('div'), animationValues[0], animationValues[1], animationValues[2], animationValues[3], animationValues[4]);
            (offset >= 0 && offset < windowHeight) ? actualBlock.addClass('visible') : actualBlock.removeClass('visible');
        });

        checkNavigation();
    }

    function transformSection(element, translateY, scaleValue, rotateXValue, opacityValue, boxShadow) {
        //transform sections - normal scroll
        element.velocity({
            translateY: translateY + 'vh',
            scale: scaleValue,
            rotateX: rotateXValue,
            opacity: opacityValue,
            boxShadowBlur: boxShadow + 'px',
            translateZ: 0,
        }, 0);
    }

    function initHijacking() {
        // initialize section style - scrollhijacking
        var visibleSection = sectionsAvailable.filter('.visible'),
                topSection = visibleSection.prevAll('.cd-section'),
                bottomSection = visibleSection.nextAll('.cd-section'),
                animationParams = selectAnimation(animationType, false),
                animationVisible = animationParams[0],
                animationTop = animationParams[1],
                animationBottom = animationParams[2];

        visibleSection.children('div').velocity(animationVisible, 1, function () {
            visibleSection.css('opacity', 1);
            topSection.css('opacity', 1);
            bottomSection.css('opacity', 1);
        });
        topSection.children('div').velocity(animationTop, 0);
        bottomSection.children('div').velocity(animationBottom, 0);
    }

    function scrollHijacking(event) {
        // on mouse scroll - check if animate section
        if (event.originalEvent.detail < 0 || event.originalEvent.wheelDelta > 0) {
            delta--;
            (Math.abs(delta) >= scrollThreshold) && prevSection();
        } else {
            delta++;
            (delta >= scrollThreshold) && nextSection();
        }
        return false;
    }

    function prevSection(event) {
        //go to previous section
        typeof event !== 'undefined' && event.preventDefault();

        var visibleSection = sectionsAvailable.filter('.visible'),
                middleScroll = (hijacking == 'off' && $(window).scrollTop() != visibleSection.offset().top) ? true : false;
        visibleSection = middleScroll ? visibleSection.next('.cd-section') : visibleSection;

        var animationParams = selectAnimation(animationType, middleScroll, 'prev');
        unbindScroll(visibleSection.prev('.cd-section'), animationParams[3]);

        if (!animating && !visibleSection.is(":first-child")) {
            animating = true;
            visibleSection.removeClass('visible').children('div').velocity(animationParams[2], animationParams[3], animationParams[4])
                    .end().prev('.cd-section').addClass('visible').children('div').velocity(animationParams[0], animationParams[3], animationParams[4], function () {
                animating = false;
                if (hijacking == 'off')
                    $(window).on('scroll', scrollAnimation);
            });

            actual = actual - 1;
        }

        resetScroll();
    }

    function nextSection(event) {
        //go to next section
        typeof event !== 'undefined' && event.preventDefault();

        var visibleSection = sectionsAvailable.filter('.visible'),
                middleScroll = (hijacking == 'off' && $(window).scrollTop() != visibleSection.offset().top) ? true : false;

        var animationParams = selectAnimation(animationType, middleScroll, 'next');
        unbindScroll(visibleSection.next('.cd-section'), animationParams[3]);

        if (!animating && !visibleSection.is(":last-of-type")) {
            animating = true;
            visibleSection.removeClass('visible').children('div').velocity(animationParams[1], animationParams[3], animationParams[4])
                    .end().next('.cd-section').addClass('visible').children('div').velocity(animationParams[0], animationParams[3], animationParams[4], function () {
                animating = false;
                if (hijacking == 'off')
                    $(window).on('scroll', scrollAnimation);
            });

            actual = actual + 1;
        }
        resetScroll();
    }

    function unbindScroll(section, time) {
        //if clicking on navigation - unbind scroll and animate using custom velocity animation
        if (hijacking == 'off') {
            $(window).off('scroll', scrollAnimation);
            (animationType == 'catch') ? $('body, html').scrollTop(section.offset().top) : section.velocity("scroll", {duration: time});
        }
    }

    function resetScroll() {
        delta = 0;
        checkNavigation();
    }

    function checkNavigation() {
        //update navigation arrows visibility
        (sectionsAvailable.filter('.visible').is(':first-of-type')) ? prevArrow.addClass('inactive') : prevArrow.removeClass('inactive');
        (sectionsAvailable.filter('.visible').is(':last-of-type')) ? nextArrow.addClass('inactive') : nextArrow.removeClass('inactive');
    }

    function resetSectionStyle() {
        //on mobile - remove style applied with jQuery
        sectionsAvailable.children('div').each(function () {
            $(this).attr('style', '');
        });
    }

    function deviceType() {
        //detect if desktop/mobile
        return window.getComputedStyle(document.querySelector('body'), '::before').getPropertyValue('content').replace(/"/g, "").replace(/'/g, "");
    }

    function selectAnimation(animationName, middleScroll, direction) {
        // select section animation - scrollhijacking
        var animationVisible = 'translateNone',
                animationTop = 'translateUp',
                animationBottom = 'translateDown',
                easing = 'ease',
                animDuration = 800;

        switch (animationName) {
            case 'scaleDown':
                animationTop = 'scaleDown';
                easing = 'easeInCubic';
                break;
            case 'rotate':
                if (hijacking == 'off') {
                    animationTop = 'rotation.scroll';
                    animationBottom = 'translateNone';
                } else {
                    animationTop = 'rotation';
                    easing = 'easeInCubic';
                }
                break;
            case 'gallery':
                animDuration = 1500;
                if (middleScroll) {
                    animationTop = 'scaleDown.moveUp.scroll';
                    animationVisible = 'scaleUp.moveUp.scroll';
                    animationBottom = 'scaleDown.moveDown.scroll';
                } else {
                    animationVisible = (direction == 'next') ? 'scaleUp.moveUp' : 'scaleUp.moveDown';
                    animationTop = 'scaleDown.moveUp';
                    animationBottom = 'scaleDown.moveDown';
                }
                break;
            case 'catch':
                animationVisible = 'translateUp.delay';
                break;
            case 'opacity':
                animDuration = 700;
                animationTop = 'hide.scaleUp';
                animationBottom = 'hide.scaleDown';
                break;
            case 'fixed':
                animationTop = 'translateNone';
                easing = 'easeInCubic';
                break;
            case 'parallax':
                animationTop = 'translateUp.half';
                easing = 'easeInCubic';
                break;
        }

        return [animationVisible, animationTop, animationBottom, animDuration, easing];
    }

    function setSectionAnimation(sectionOffset, windowHeight, animationName) {
        // select section animation - normal scroll
        var scale = 1,
                translateY = 100,
                rotateX = '0deg',
                opacity = 1,
                boxShadowBlur = 0;

        if (sectionOffset >= -windowHeight && sectionOffset <= 0) {
            // section entering the viewport
            translateY = (-sectionOffset) * 100 / windowHeight;

            switch (animationName) {
                case 'scaleDown':
                    scale = 1;
                    opacity = 1;
                    break;
                case 'rotate':
                    translateY = 0;
                    break;
                case 'gallery':
                    if (sectionOffset >= -windowHeight && sectionOffset < -0.9 * windowHeight) {
                        scale = -sectionOffset / windowHeight;
                        translateY = (-sectionOffset) * 100 / windowHeight;
                        boxShadowBlur = 400 * (1 + sectionOffset / windowHeight);
                    } else if (sectionOffset >= -0.9 * windowHeight && sectionOffset < -0.1 * windowHeight) {
                        scale = 0.9;
                        translateY = -(9 / 8) * (sectionOffset + 0.1 * windowHeight) * 100 / windowHeight;
                        boxShadowBlur = 40;
                    } else {
                        scale = 1 + sectionOffset / windowHeight;
                        translateY = 0;
                        boxShadowBlur = -400 * sectionOffset / windowHeight;
                    }
                    break;
                case 'catch':
                    if (sectionOffset >= -windowHeight && sectionOffset < -0.75 * windowHeight) {
                        translateY = 100;
                        boxShadowBlur = (1 + sectionOffset / windowHeight) * 160;
                    } else {
                        translateY = -(10 / 7.5) * sectionOffset * 100 / windowHeight;
                        boxShadowBlur = -160 * sectionOffset / (3 * windowHeight);
                    }
                    break;
                case 'opacity':
                    translateY = 0;
                    scale = (sectionOffset + 5 * windowHeight) * 0.2 / windowHeight;
                    opacity = (sectionOffset + windowHeight) / windowHeight;
                    break;
            }

        } else if (sectionOffset > 0 && sectionOffset <= windowHeight) {
            //section leaving the viewport - still has the '.visible' class
            translateY = (-sectionOffset) * 100 / windowHeight;

            switch (animationName) {
                case 'scaleDown':
                    scale = (1 - (sectionOffset * 0.3 / windowHeight)).toFixed(5);
                    opacity = (1 - (sectionOffset / windowHeight)).toFixed(5);
                    translateY = 0;
                    boxShadowBlur = 40 * (sectionOffset / windowHeight);

                    break;
                case 'rotate':
                    opacity = (1 - (sectionOffset / windowHeight)).toFixed(5);
                    rotateX = sectionOffset * 90 / windowHeight + 'deg';
                    translateY = 0;
                    break;
                case 'gallery':
                    if (sectionOffset >= 0 && sectionOffset < 0.1 * windowHeight) {
                        scale = (windowHeight - sectionOffset) / windowHeight;
                        translateY = -(sectionOffset / windowHeight) * 100;
                        boxShadowBlur = 400 * sectionOffset / windowHeight;
                    } else if (sectionOffset >= 0.1 * windowHeight && sectionOffset < 0.9 * windowHeight) {
                        scale = 0.9;
                        translateY = -(9 / 8) * (sectionOffset - 0.1 * windowHeight / 9) * 100 / windowHeight;
                        boxShadowBlur = 40;
                    } else {
                        scale = sectionOffset / windowHeight;
                        translateY = -100;
                        boxShadowBlur = 400 * (1 - sectionOffset / windowHeight);
                    }
                    break;
                case 'catch':
                    if (sectionOffset >= 0 && sectionOffset < windowHeight / 2) {
                        boxShadowBlur = sectionOffset * 80 / windowHeight;
                    } else {
                        boxShadowBlur = 80 * (1 - sectionOffset / windowHeight);
                    }
                    break;
                case 'opacity':
                    translateY = 0;
                    scale = (sectionOffset + 5 * windowHeight) * 0.2 / windowHeight;
                    opacity = (windowHeight - sectionOffset) / windowHeight;
                    break;
                case 'fixed':
                    translateY = 0;
                    break;
                case 'parallax':
                    translateY = (-sectionOffset) * 50 / windowHeight;
                    break;

            }

        } else if (sectionOffset < -windowHeight) {
            //section not yet visible
            translateY = 100;

            switch (animationName) {
                case 'scaleDown':
                    scale = 1;
                    opacity = 1;
                    break;
                case 'gallery':
                    scale = 1;
                    break;
                case 'opacity':
                    translateY = 0;
                    scale = 0.8;
                    opacity = 0;
                    break;
            }

        } else {
            //section not visible anymore
            translateY = -100;

            switch (animationName) {
                case 'scaleDown':
                    scale = 0;
                    opacity = 0.7;
                    translateY = 0;
                    break;
                case 'rotate':
                    translateY = 0;
                    rotateX = '90deg';
                    break;
                case 'gallery':
                    scale = 1;
                    break;
                case 'opacity':
                    translateY = 0;
                    scale = 1.2;
                    opacity = 0;
                    break;
                case 'fixed':
                    translateY = 0;
                    break;
                case 'parallax':
                    translateY = -50;
                    break;
            }
        }

        return [translateY, scale, rotateX, opacity, boxShadowBlur];
    }

    /*
     IMPORTANT
     this is for the demo only
     remove this in normal production
     */
    var domain = 'http://codyhouse.co/demo/page-scroll-effects/';
    $('.cd-demo-settings').on('change', function () {
        var animation = $('#selectAnimation').find("option:selected").val(),
                scrollType = $('#selectHijacking').find("option:selected").val(),
                newFile = (scrollType == 'off') ? animation + '.html' : animation + '-hijacking.html';
        window.location.href = domain + newFile;
    });
});

/* Custom effects registration - feature available in the Velocity UI pack */
//none
$.Velocity
        .RegisterEffect("translateUp", {
            defaultDuration: 1,
            calls: [
                [{translateY: '-100%'}, 1]
            ]
        });
$.Velocity
        .RegisterEffect("translateDown", {
            defaultDuration: 1,
            calls: [
                [{translateY: '100%'}, 1]
            ]
        });
$.Velocity
        .RegisterEffect("translateNone", {
            defaultDuration: 1,
            calls: [
                [{translateY: '0', opacity: '1', scale: '1', rotateX: '0', boxShadowBlur: '0'}, 1]
            ]
        });

//scale down
$.Velocity
        .RegisterEffect("scaleDown", {
            defaultDuration: 1,
            calls: [
                [{opacity: '0', scale: '0.7', boxShadowBlur: '40px'}, 1]
            ]
        });
//rotation
$.Velocity
        .RegisterEffect("rotation", {
            defaultDuration: 1,
            calls: [
                [{opacity: '0', rotateX: '90', translateY: '-100%'}, 1]
            ]
        });
$.Velocity
        .RegisterEffect("rotation.scroll", {
            defaultDuration: 1,
            calls: [
                [{opacity: '0', rotateX: '90', translateY: '0'}, 1]
            ]
        });
//gallery
$.Velocity
        .RegisterEffect("scaleDown.moveUp", {
            defaultDuration: 1,
            calls: [
                [{translateY: '-10%', scale: '0.9', boxShadowBlur: '40px'}, 0.20],
                [{translateY: '-100%'}, 0.60],
                [{translateY: '-100%', scale: '1', boxShadowBlur: '0'}, 0.20]
            ]
        });
$.Velocity
        .RegisterEffect("scaleDown.moveUp.scroll", {
            defaultDuration: 1,
            calls: [
                [{translateY: '-100%', scale: '0.9', boxShadowBlur: '40px'}, 0.60],
                [{translateY: '-100%', scale: '1', boxShadowBlur: '0'}, 0.40]
            ]
        });
$.Velocity
        .RegisterEffect("scaleUp.moveUp", {
            defaultDuration: 1,
            calls: [
                [{translateY: '90%', scale: '0.9', boxShadowBlur: '40px'}, 0.20],
                [{translateY: '0%'}, 0.60],
                [{translateY: '0%', scale: '1', boxShadowBlur: '0'}, 0.20]
            ]
        });
$.Velocity
        .RegisterEffect("scaleUp.moveUp.scroll", {
            defaultDuration: 1,
            calls: [
                [{translateY: '0%', scale: '0.9', boxShadowBlur: '40px'}, 0.60],
                [{translateY: '0%', scale: '1', boxShadowBlur: '0'}, 0.40]
            ]
        });
$.Velocity
        .RegisterEffect("scaleDown.moveDown", {
            defaultDuration: 1,
            calls: [
                [{translateY: '10%', scale: '0.9', boxShadowBlur: '40px'}, 0.20],
                [{translateY: '100%'}, 0.60],
                [{translateY: '100%', scale: '1', boxShadowBlur: '0'}, 0.20]
            ]
        });
$.Velocity
        .RegisterEffect("scaleDown.moveDown.scroll", {
            defaultDuration: 1,
            calls: [
                [{translateY: '100%', scale: '0.9', boxShadowBlur: '40px'}, 0.60],
                [{translateY: '100%', scale: '1', boxShadowBlur: '0'}, 0.40]
            ]
        });
$.Velocity
        .RegisterEffect("scaleUp.moveDown", {
            defaultDuration: 1,
            calls: [
                [{translateY: '-90%', scale: '0.9', boxShadowBlur: '40px'}, 0.20],
                [{translateY: '0%'}, 0.60],
                [{translateY: '0%', scale: '1', boxShadowBlur: '0'}, 0.20]
            ]
        });
//catch up
$.Velocity
        .RegisterEffect("translateUp.delay", {
            defaultDuration: 1,
            calls: [
                [{translateY: '0%'}, 0.8, {delay: 100}],
            ]
        });
//opacity
$.Velocity
        .RegisterEffect("hide.scaleUp", {
            defaultDuration: 1,
            calls: [
                [{opacity: '0', scale: '1.2'}, 1]
            ]
        });
$.Velocity
        .RegisterEffect("hide.scaleDown", {
            defaultDuration: 1,
            calls: [
                [{opacity: '0', scale: '0.8'}, 1]
            ]
        });
//parallax
$.Velocity
        .RegisterEffect("translateUp.half", {
            defaultDuration: 1,
            calls: [
                [{translateY: '-50%'}, 1]
            ]
        });
$(window).scroll(function () {
    $btest = $('#cheers').visible();
    $buble = $('#animationholder').visible();
    $office = $('#starttypinganim').visible();
    if ($btest === true) {
        $('#beersstart').addClass('startbeers');
    } else {
        $('#beersstart').removeClass('startbeers');
    }

    if ($buble !== true) {
        $('#bubbles').addClass('nobuble');
    } else {
        $('#bubbles').removeClass('nobuble');
    }


    if ($office === true) {
        $('#officecontent').addClass('animtext');
    }
});
document.getElementById('pizza1').onclick = function () {
    document.getElementById('showhidepizza').setAttribute('aria-hidden', 'false');
    document.getElementById('modal_holder_pizza').setAttribute('class', 'pizza1');
};
document.getElementById('pizza2').onclick = function () {
    document.getElementById('showhidepizza').setAttribute('aria-hidden', 'false');
    document.getElementById('modal_holder_pizza').setAttribute('class', 'pizza2');
};
document.getElementById('pizza3').onclick = function () {
    document.getElementById('showhidepizza').setAttribute('aria-hidden', 'false');
    document.getElementById('modal_holder_pizza').setAttribute('class', 'pizza3');
};
document.getElementById('pizza4').onclick = function () {
    document.getElementById('showhidepizza').setAttribute('aria-hidden', 'false');
    document.getElementById('modal_holder_pizza').setAttribute('class', 'pizza4');
};
$('#show').on('click', function (e) {
    $(this).parent().parent().parent().parent().find('.modal-overlay').attr('aria-hidden', 'false');

});
$('.modal-overlay').on('click', function (e) {
    $(this).attr('aria-hidden', 'true');
    document.getElementById('modal_holder_pizza').setAttribute('class', 'modal-content');
});
$('.btn-close').on('click', function (e) {
    $(this).parent().parent().attr('aria-hidden', 'true');
    document.getElementById('modal_holder_pizza').setAttribute('class', 'modal-content');
});
document.getElementById('firstbo').onclick = function () {
    this.className += " goaway";
};
document.getElementById('note').onclick = function () {
    this.setAttribute('class', "fallnote");
};


var newText = document.getElementById('response');
var delay = (function () {
    var timer = 0;
    return function (callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();
function go() {
    delay(function () {
        beers = document.getElementById('game').value;
        switch (true) {
            case beers === '0':
                result = newText.innerHTML = 'Young padawan to learn has much!';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-0.jpg';
                break;
            case beers === '1':
                result = newText.innerHTML = 'NameError: You and your life are undefined.';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-1.jpg';
                break;
            case beers === '2':
                result = newText.innerHTML = 'So, what’s the story behind your non-drinking?';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-2.jpg';
                break;
            case beers === '3':
                result = newText.innerHTML = 'One of those “occasional” drinkers, aren’t you?';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-3.jpg';
                break;
            case beers === '4':
                result = newText.innerHTML = 'The odd one called “the beer saver”.';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-4.jpg';
                break;
            case beers === '5':
                result = newText.innerHTML = 'Just… meh.';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-5.jpg';
                break;
            case beers === '6':
                result = newText.innerHTML = 'You might even survive through the first half of the work day.';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-6.jpg';
                break;
            case beers === '7':
                result = newText.innerHTML = 'The first to pass out.';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-7.jpg';
                break;
            case beers === '8':
                result = newText.innerHTML = 'Valar Drinhaeris! All men must drink!';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-8.jpg';
                break;
            case beers === '9':
                result = newText.innerHTML = 'One could always have another “Programistko”.';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-9.jpg';
                break;
            case beers === '10':
                result = newText.innerHTML = 'You just met our lowest criteria, congrats!';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-10.jpg';
                break;
            case beers === '11':
                result = newText.innerHTML = 'The ‘while’ loop of your drinking doesn’t end here, does it?';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-11.jpg';
                break;
            case beers === '12':
                result = newText.innerHTML = 'Are you sure you are not actually drinking some    of the trendy fruit beers?';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-12.jpg';
                break;
            case beers === '13':
                result = newText.innerHTML = 'You are the one with a beer in each hand when you  don’t code, aren’t you?';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-13.jpg';
                break;
            case beers === '14':
                result = newText.innerHTML = 'Are you sure you are not somehow related to  <br>  Cersei or Robert Baratheon?';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-14.jpg';
                break;
            case beers === '15':
                result = newText.innerHTML = '15 and you are still coding!? Then we are still counting!';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-15.jpg';
                break;
            case beers === '16':
                result = newText.innerHTML = 'We need to ask you, is there a code for not getting drunk?';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-16.jpg';
                break;
            case beers === '17':
                result = newText.innerHTML = 'You are a threat to every man’s beer stash.';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-17.jpg';
                break;
            case beers === '18':
                result = newText.innerHTML = 'You are like a regex – everyone will need your help at some point.';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-18.jpg';
                break;
            case beers === '19':
                result = newText.innerHTML = 'Be careful if you have to solve this problem  you can’t call tech support!';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-19.jpg';
                break;
            case beers >= 20 && beers <= 49:
                result = newText.innerHTML = 'You are the perfect creation of life’s software development!';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-20+.jpg';
                break;
            case beers >= 50 && beers <= 99:
                result = newText.innerHTML = 'TypeError: Your value is considered ‘None’… after so many “Programistko”!';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-50+.jpg';
                break;
            case beers >= 100 :
                result = newText.innerHTML = 'We do not remember creating an endless while loop!?';
                imgRes = 'http://www.obecto.com/careers/img/Obecto-Memo-100+.jpg';
                break;
            default :
                result = newText.innerHTML = '';
                break;
        }
        document.getElementById('temphidden').style.visibility = 'visible';
        document.getElementById('game').style.animation = 'none';

    }, 1000);
}
;
document.getElementById('game').onkeyup = go;
document.getElementById('imgmachine').onclick = function () {
    document.getElementById('temphidden').style.visibility = 'visible';
    this.setAttribute('class', "morebeer");

    currBears = document.getElementById('game').value;
    if (currBears === '' || currBears === ' ') {
        document.getElementById('game').value = 1;
        go();
    } else {
        numB = parseInt(currBears);

        document.getElementById('game').value = numB + 1;
        go();
    }
    setTimeout(function () {
        document.getElementById('imgmachine').removeAttribute('class');
    }, 4000);
};

document.getElementById('sharethis').onclick = function () {
    FB.ui({
        method: 'feed',
        name: 'Мога да изпия "' + beers + '" бири Програмистко и все още да кодя',
        description: 'Приех предизвикателството на Obecto и разбрах че мога да изпия  "' + beers + '" бири Програмистко и все още да кодя. Провери и ти с колко бири можеш да се справиш.',
        picture: imgRes
    });
}
