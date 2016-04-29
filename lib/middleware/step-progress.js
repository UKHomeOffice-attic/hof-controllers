'use strict';

var _ = require('lodash');

module.exports = function stepProgress(options) {
  var stepsConfig = options.steps;
  var firstStep = options.firstStep || '/';

  var traverse = function traverse(step, steps, result) {
    result = result || [];
    var next = step.next;
    if (next && steps[next]) {
      return traverse(steps[next], steps, result.concat(step));
    }
    return result;
  };

  var getStepNumber = function getStepNumber(stepsJourney, route) {
    // find index of current step, return as
    // 1-indexed for display.
    return stepsJourney.indexOf(route) + 1;
  };

  var getTotalSteps = function getTotalSteps(stepsJourney, steps, start) {
    stepsJourney = stepsJourney || [];
    // get path by using only next params
    var linearPath = traverse(steps[start], steps);
    var linearPathSteps = _.pluck(linearPath, 'next');

    var index = 0;
    var forks = [];

    var arr = stepsJourney.slice(0);

    while (index < arr.length) {
      // if value doesn't follow the standard linear order
      // it is a fork, store value and continue with
      // comparison
      if (arr[index] !== linearPathSteps[index]) {
        forks.push(arr[index]);
        arr.splice(index, 1);
      } else {
        index++;
      }
    }

    // if no forks then journey is linear
    if (!forks.length) {
      return linearPath.length;
    }

    // we only need the last fork, as previous
    // forks will be included in the previous
    // journey steps.
    var lastFork = forks[forks.length - 1];
    var stepsBefore = stepsJourney.indexOf(lastFork);
    // traverse linearly from point of fork
    var shortestRouteToEnd = traverse(steps[lastFork], steps);

    // amount of steps before fork + fork + linear
    // steos after fork.
    return (stepsBefore + 1) + shortestRouteToEnd.length;
  };

  var getStepsJourney = function getStepsJourney(req, stepsJourney, prevStep, route) {

    stepsJourney = stepsJourney || [];
    // add currentStep to journey if not
    // already added
    if (stepsJourney.indexOf(route) === -1) {
      if (prevStep === undefined) {
        stepsJourney.push(route);
      } else {
        // add current step after the prev step
        // to preserve journey order
        var prevIndex = stepsJourney.indexOf(prevStep);
        stepsJourney.splice(prevIndex + 1, 0, route);
      }
    }

    return stepsJourney;
  };

  return function stepProgressMiddleware(req, res, next) {
    var route = req.url.replace(/\/edit$/, '');
    var sessionModel = req.sessionModel;
    var stepData = sessionModel.get('stepData') || {};
    var stepsJourney = getStepsJourney(req, stepData.stepsJourney, stepData.prevStep, route);

    req.sessionModel.set('stepData', {
      stepsJourney: stepsJourney,
      prevStep: route,
      stepNumber: getStepNumber(stepsJourney, route),
      totalSteps: getTotalSteps(stepsJourney, stepsConfig, firstStep)
    });

    next();
  };
};
