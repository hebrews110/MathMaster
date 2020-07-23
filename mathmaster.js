/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Add instructions */

/* Calculator thing: https://upload.wikimedia.org/wikipedia/commons/7/7e/Calcman.png */


var Fraction = algebra.Fraction;
var Expression = algebra.Expression;
var Equation = algebra.Equation;

var currentEquation;
var originalEquation;


var leftWeight, rightWeight;
var realX = 0;

var isBalanced = false;

var eqString = "";

var targetAngle = 0;
var movementAngle = 10;
var mathObjHeight = 25;

var $animationObject;

var barAngle = 0;

/* Patch in Math.sign for unsupported browsers */

if (!Math.sign) {
  Math.sign = function(x) {
    // If x is NaN, the result is NaN.
    // If x is -0, the result is -0.
    // If x is +0, the result is +0.
    // If x is negative and not -0, the result is -1.
    // If x is positive and not +0, the result is +1.
    return ((x > 0) - (x < 0)) || +x;
    // A more aesthetical persuado-representation is shown below
    //
    // ( (x > 0) ? 0 : 1 )  // if x is negative then negative one
    //          +           // else (because you cant be both - and +)
    // ( (x < 0) ? 0 : -1 ) // if x is positive then positive one
    //         ||           // if x is 0, -0, or NaN, or not a number,
    //         +x           // Then the result will be x, (or) if x is
    //                      // not a number, then x converts to number
  };
}

Equation.prototype.subtract = function(val, simplify) {
    return new Equation(this.lhs.subtract(val, simplify), this.rhs.subtract(val, simplify));
};

Equation.prototype.add = function(val, simplify) {
    return new Equation(this.lhs.add(val, simplify), this.rhs.add(val, simplify));
};

Equation.prototype.multiply = function(val, simplify) {
    return new Equation(this.lhs.multiply(val, simplify), this.rhs.multiply(val, simplify));
};

Equation.prototype.divide = function(val, simplify) {
    return new Equation(this.lhs.divide(val, simplify), this.rhs.divide(val, simplify));
};

Equation.prototype.eval = function(obj) {
    return new Equation(this.lhs.eval(obj), this.rhs.eval(obj));
};

Fraction.prototype.invert = function() {
    return new Fraction(this.denom, this.numer);
};



function updateEquation(equationExecution) {
    var isSolved = false;
    var thisString;
    var latex = algebra.toTex(currentEquation);
    
    eqString += thisString = katex.renderToString(latex, {throwOnError: false }) + "<br>";
    $("#equation-box").html(eqString);
    $("#equation-box").scrollTop($("#equation-box")[0].scrollHeight - $("#equation-box").height());

    console.log("LT " + currentEquation.lhs.terms.length); // 1
    console.log("RT " +currentEquation.rhs.terms.length); // 0
    console.log("LC " + currentEquation.lhs.constants.length); // 0
    console.log("RC " + currentEquation.rhs.constants.length); // 0
    /* Required: Equation of the form x = i (or i = x), where i is an integer */
    if((currentEquation.lhs.terms.length === 1 && currentEquation.rhs.constants.length < 2) &&
       (currentEquation.rhs.terms.length === 0 && currentEquation.lhs.constants.length === 0)) {
        if(currentEquation.lhs.terms[0].coefficients[0].equalTo(new Fraction(1, 1)))
            isSolved = true;
    } else
    if((currentEquation.rhs.terms.length === 1 && currentEquation.lhs.constants.length < 2) &&
       (currentEquation.lhs.terms.length === 0 && currentEquation.rhs.constants.length === 0)) {
        if(currentEquation.rhs.terms[0].coefficients[0].equalTo(new Fraction(1, 1)))
           isSolved = true;
    }
    
    if(equationExecution !== undefined && equationExecution) {
        /* We're solving the equation */
        /* dump it onto the shelves */
        resync(currentEquation.lhs, $("#left-balance-div").find(".balance-items"));
        resync(currentEquation.rhs, $("#right-balance-div").find(".balance-items"));
    }
    
    if(isSolved) {
        showEquationDialog(false);
        $("#finished-equation").html(thisString);
        $("#success-screen").show();
        $("#blocks-screen").hide();
    }
}

Number.isInteger = Number.isInteger || function(value) {
  return typeof value === 'number' && 
    isFinite(value) && 
    Math.floor(value) === value;
};

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function generateEquation() {
    var isOneStep = getParameterByName("oneStep") != null;
    var lhs, rhs;
    if(!isOneStep) {
        var rhc_int;
        
        /* First generate the left hand side of the equation */
        lhs = new Expression("x");
        /* Generate the coefficient */
        var lhc = getRandomInt(1, 4);
        lhs = lhs.multiply(lhc);
        /* Optionally, add a value to the left side */
        
        lhs = lhs.add(isOneStep ? 0 : getRandomInt(0, 9));
        
        /* Generating the right hand side is trickier. We must be very careful to
         * actually keep the equation balanced. Start out by choosing a similar coefficient.
         */
        rhs = new Expression("x");
        
        do {
            rhc_int = getRandomInt(1, 4);
        } while(rhc_int === lhc);
        var rhc = new Fraction(rhc_int, 1);
        console.log(rhc);
        rhs = rhs.multiply(rhc);
        console.log(rhs);
        /* Now add a temporary variable, "b" to the equation. Just like calculating
         * the y-intercept in a high school algebra slope equation, we calculate the
         * necessary value to add to the right by solving the equation for b.
         */
        var bVar = new Expression("b");
        rhs = rhs.add(bVar.copy());
        var tmpEquation = new Equation(lhs.copy(), rhs.copy());
        var b;
        do {
            realX = getRandomInt(-3, 10);
            var tmpEquation2 = tmpEquation.eval({ x : realX });
            b = tmpEquation2.solveFor("b");
            console.log(b);
        } while(realX == 0 || b.denom !== 1 || b.numer < 0 || b.numer > 9);
        
        /* Substitute b's value into the original equation */
        rhs = rhs.subtract(bVar).add(b);
    } else {
        do {
            realX = getRandomInt(-3, 10);
        } while(realX == 0);
        var operationMode = getRandomInt(1, 3);
        var operationFnNames = [ "add", "subtract", "multiply" ];
        var secondNum = (operationMode==3) ? getRandomInt(1, 5) : getRandomInt(1, 20);
        lhs = new Expression("x")[operationFnNames[operationMode-1]](secondNum);
        var otherNum = lhs.eval({ x: realX });
        rhs = new Expression(otherNum.constant().valueOf());
        if(Math.random() < 0.5) {
            var tmp = lhs;
            lhs = rhs;
            rhs = tmp;
        }
    }
    leftWeight = new Expression(0);
    rightWeight = new Expression(0);
    eqString = "";
    return new Equation(lhs, rhs);
}

function updateBalance() {
    console.log("Left hand: " + leftWeight.toString());
    console.log("Right hand: " + rightWeight.toString());
    $("#shelf-eq-left").text(leftWeight.toString());
    $("#shelf-eq-right").text(rightWeight.toString());
    var dif = rightWeight.subtract(leftWeight);
    console.log("X: " + realX);
    dif = dif.eval({ x: realX });
    var dif_int = parseInt(dif.toString());
    console.log("Difference: " + dif_int);
    var $rightShelf = $($(".weight-div")[1]);
    var $leftShelf = $($(".weight-div")[0]);
    if(dif_int > 0)
    {
        console.log("Right shelf is lower");
        goToAngle(movementAngle);
        isBalanced = false;
    } else if(dif_int < 0) {
        console.log("Left shelf is lower");
        goToAngle(-movementAngle);
        isBalanced = false;
    } else {
        console.log("Equivalent");
        goToAngle(0);
        isBalanced = true;
    }

    var newEquation = new Equation(leftWeight, rightWeight);
    console.log(newEquation.toString());
    if(newEquation.toString() === originalEquation.toString()) {
        $("#matches").html("Blocks on the shelf match the equation!!");
        showEquationDialog();
    } else
        $("#matches").html("Blocks on the shelf don't match the equation.");
    
    $(".math-obj-on-shelf").off('click').click(function() {
        console.log("A CLICK EVENT");
        var expr = algebra.parse($(this).text());
        console.log(expr);
        if($(this).parent().parent().parent().attr("id") === "left-balance-div") {
            leftWeight = leftWeight.subtract(expr);
            resync(leftWeight, $(this).parent());
        } else {
            rightWeight = rightWeight.subtract(expr);
            resync(rightWeight, $(this).parent());
        }
        $(this).remove();
        updateBalance();
    });
}

function resync(expression, $shelfside) {
    $shelfside.empty();
    for(var i = 0; i < expression.terms.length; i++) {
        
        var n = expression.terms[i].coefficient().valueOf();
        for(var j = 0; j < Math.abs(n); j++) {
            var newEl = document.createElement("div");
            newEl.classList.add("math-obj");
            newEl.classList.add("math-obj-on-shelf");
            var prefix = "";
            if(Math.abs(n) < 1)
                prefix += expression.terms[i].coefficient().toString();
            else if(n < 0) {
                newEl.classList.add("math-obj-negative");
                prefix = "-";
            }
            
                
            $(newEl).text(prefix + expression.terms[i].variables[0].toString());
            $shelfside.append(newEl);
        }
    }
    console.log("Constants on " + $shelfside.toString() + ": " + expression.constants.length);
    for(var i = 0; i < expression.constants.length; i++) {
        var abs_fract = Math.abs(expression.constants[i].valueOf());
        if(abs_fract > 0 && abs_fract < 1) {
            var newEl = document.createElement("div");
            newEl.classList.add("math-obj");
            newEl.classList.add("math-obj-on-shelf");
            newEl.classList.add("math-obj-number");
            if(expression.constants[i].valueOf() < 0) {
                newEl.classList.add("math-obj-negative");
            }
            $(newEl).text(expression.constants[i].toString());
            $shelfside.append(newEl);
        } else {
            /* Is a number - split it into individual blocks */
            var isNegative = (expression.constants[i].valueOf()) < 0;
            for(var j = 0; j < abs_fract; j++) {
                var prefix = "";
                var newEl = document.createElement("div");
                newEl.classList.add("math-obj");
                newEl.classList.add("math-obj-on-shelf");
                newEl.classList.add("math-obj-number");
                if(isNegative) {
                    newEl.classList.add("math-obj-negative");
                    prefix = "-";
                }
                $(newEl).text(prefix + "1");
                $shelfside.append(newEl);
            }
        }
    }
}

function showEquationDialog(show) {
    if(show === undefined || show) {
        $("#blocks-screen").hide();
        $("#success-screen").hide();
        $("#equation-simplify-screen").show();
    } else {
        $("#equation-simplify-screen").hide();
        $("#success-screen").hide();
        $("#blocks-screen").show();
    }
}

function reposition($this) {
    for(var i = 2; i < $this.children().length; i++) {
        var $el = $($this.children()[i]);
        $el.css({ bottom: 'calc(32px + ' + (mathObjHeight*(i-2)) + 'px)' });
    }
}


function nextEquation() {
    $(".balance-items").empty();
    try { $("#finished-dialog").dialog('close'); } catch (e) {}
    $("#success-screen").hide();
    $("#blocks-screen").show();
    originalEquation = currentEquation = generateEquation();
    updateEquation();
    katex.render(algebra.toTex(originalEquation), $("#original-equation-2")[0]);
    updateBalance();
}

$(function() {
    const pretty = document.getElementById('pretty');
    
    

   
    $("input[type='radio']").checkboxradio( { icon: false });
    $("input[type='radio']").click(function() {
        var phrase = $(this).attr("data-phrase");
        $("#operation-name").text(phrase);
    });
    $("#operation-execute").click(function() {
        var $radio = $('input[name=math-things]:checked');
        var $r_id =  $radio.attr("id");
        
        var char = $("label[for=" + $r_id + "]").text();
        var val = $("#add-value").val();
        var expr;
        
        try { expr = algebra.parse(val); } catch (e) { return; };
        
        
        if(expr instanceof Equation)
            return;
        
        expr = expr.simplify();
        
        console.log(char);
        console.log(expr);
        $("#error-msg").text("");
        switch(char) {
            case '\u002B':
                currentEquation = currentEquation.add(expr);
                break;
            case '\u00D7':
                currentEquation = currentEquation.multiply(expr);
                break;
            case '\u2212':
                currentEquation = currentEquation.subtract(expr);
                break;
            case '\u00F7':
                /* Division is handled poorly by the library */
                if(expr.terms.length === 0 && expr.constants.length === 1) {
                    /* Convert it to a fraction */
                    currentEquation = currentEquation.multiply(expr.constants[0].invert());
                } else
                    $("#error-msg").text("Dividing by a variable is not necessary.");
                
                break;
            default:
                return;
        }
        
        if($("#error-msg").text() === "") {
            updateEquation(true);
        }
    }); 
    $("#add-button").click();
    
    //$("#equation-dialog").dialog({ modal: true, dialogClass: 'noTitleStuff', width: 'auto', height: 'auto' });
    //showEquationDialog();
    $(".math-obj:not(.math-obj-on-shelf)").draggable({ revert: "invalid", helper: "clone", zIndex: 20 });
    $(".balance-items").droppable({
        accept: ".math-obj:not(.math-obj-on-shelf)",
        drop: function(event, ui) {
            var expr = algebra.parse($(ui.helper).text());
            
            if($(this).parent().parent().attr("id") === "left-balance-div") {
                leftWeight = leftWeight.add(expr);
                resync(leftWeight, $(this));
            } else {
                rightWeight = rightWeight.add(expr);
                resync(rightWeight, $(this));
            }
            /*
            var $newEl = $(ui.helper).clone().removeClass('ui-draggable');
            $newEl.removeClass('ui-draggable-dragging');
            $newEl.removeClass('ui-draggable-handle');
            $newEl.css({ position: '', top: '', left: '' });
            $newEl.addClass('math-obj-on-shelf');
            $(this).append($newEl); */
            updateBalance();
        }
    });
    nextEquation();
    katex.render("x", $("#x-var")[0]);
    $("#instructions-dialog").dialog({ modal: true });
    showEquationDialog(false);
});

function dtor(angle) {
    return angle * (Math.PI/180);
}

function goToAngle(angle) {
    if(angle === barAngle) {
        if($animationObject !== undefined)
            $animationObject.stop();
        return;
    } else if(angle === targetAngle) {
        return;
    }
    targetAngle = angle;
    $animationObject = $({ n: barAngle }).animate({ n: angle }, {
        duration: 2000,
        step: function(now, fx) {
            barAngle = now;
        }
    });
};

/* P5.JS */

const s = function( p ) {
  var strokeThickness = 5;
  var w, h;
  
  var yPos;
  
  var balanceRadius;
    function checkForChanges()
    {
        var $element = $("#shelf-canvas");
        if ($element.height() !== h || $element.width !== w)
        {
            resizedThing();
        }
        setTimeout(checkForChanges, 100);
    }
  var resizedThing = function() {
    w = $("#shelf-canvas").width();
    h = $("#shelf-canvas").height();
    yPos = h - (h / 10);
    balanceRadius = w / 4;
    p.resizeCanvas(w, h);
  };
  p.setup = function() {
    p.createCanvas($("#shelf-canvas").width(), $("#shelf-canvas").height());
    goToAngle(0);
    checkForChanges();
  };

  p.draw = function() {
    p.background('rgba(0, 0, 0, 0)');
    p.fill(0);
    p.strokeWeight(strokeThickness);
    p.line(w / 2, yPos, w / 2, h - 10);
    p.ellipse(w / 2, h, 30, 15);
    p.noFill();
    
    /* First draw the right half of the bar */
    
    /* Use trig to calculate the end points */
    var endX_r = (w / 2) + Math.cos(dtor(barAngle))*balanceRadius;
    var endY_r = (yPos) + Math.sin(dtor(barAngle))*balanceRadius;
    /* P5.JS has a reversed Y setup compared to Cartesian plane */
    p.line(w / 2, yPos, endX_r, endY_r);
    $("#right-balance-div").css({ top: endY_r, left: endX_r });
    
    /* Now repeat for the other half */
    
    /* Use trig to calculate the end points */
    var endX_l = (w / 2) - Math.cos(dtor(barAngle))*balanceRadius;
    var endY_l = (yPos) - Math.sin(dtor(barAngle))*balanceRadius;
    /* P5.JS has a reversed Y setup compared to Cartesian plane */
    p.line(w / 2, yPos, endX_l, endY_l);
    $("#left-balance-div").css({ top: endY_l, left: endX_l });
    
  };
};

var myp5 = new p5(s, 'shelf-canvas');


function measureText(pText, pFontSize, pFamily, pWeight) {
    var lDiv = document.createElement('div');

    document.body.appendChild(lDiv);
  
    if (pFamily != null) {
        lDiv.style.fontFamily = pFamily;
    }
    if (pWeight != null) {
        lDiv.style.fontWeight = pWeight;
    }
    lDiv.style.fontSize = "" + pFontSize + "px";
    lDiv.style.position = "absolute";
    lDiv.style.left = -1000;
    lDiv.style.top = -1000;
 
    lDiv.innerHTML = pText;

    var lResult = {
        width: lDiv.clientWidth,
        height: lDiv.clientHeight
    };

    document.body.removeChild(lDiv);
    lDiv = null;

  return lResult;
}
 