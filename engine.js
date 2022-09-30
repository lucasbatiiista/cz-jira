'format cjs';

var wrap = require('word-wrap');
var map = require('lodash.map');
var longest = require('longest');
var chalk = require('chalk');

var filter = function(array) {
  return array.filter(function(x) {
    return x;
  });
};

var headerLength = function(answers) {
  return (
    answers.type.length + 2 + (answers.scope ? answers.scope.length + 2 : 0)
  );
};

var maxSummaryLength = function(options, answers) {
  return options.maxHeaderWidth - headerLength(answers);
};

var filterSubject = function(subject, disableSubjectLowerCase) {
  subject = subject.trim();
  if (
    !disableSubjectLowerCase &&
    subject.charAt(0).toLowerCase() !== subject.charAt(0)
  ) {
    subject =
      subject.charAt(0).toLowerCase() + subject.slice(1, subject.length);
  }
  while (subject.endsWith('.')) {
    subject = subject.slice(0, subject.length - 1);
  }
  return subject;
};

// This can be any kind of SystemJS compatible module.
// We use Commonjs here, but ES6 or AMD would do just
// fine.
module.exports = function(options) {
  var types = options.types;

  var length = longest(Object.keys(types)).length + 1;
  var choices = map(types, function(type, key) {
    return {
      name: (key + ':').padEnd(length) + ' ' + type.description,
      value: key
    };
  });

  return {
    // When a user runs `git cz`, prompter will
    // be executed. We pass you cz, which currently
    // is just an instance of inquirer.js. Using
    // this you can ask questions and get answers.
    //
    // The commit callback should be executed when
    // you're ready to send back a commit template
    // to git.
    //
    // By default, we'll de-indent your commit
    // template and will keep empty lines.
    prompter: function(cz, commit) {
      // Let's ask some questions of the user
      // so that we can populate our commit
      // template.
      //
      // See inquirer.js docs for specifics.
      // You can also opt to use another input
      // collection library if you prefer.
      cz.prompt([
        {
          type: 'input',
          name: 'storyKey',
          message: 'What is the story key? (e.g. 12345):',
          validate: function(storyKey) {
            return storyKey && storyKey.length > 0
              ? true
              : 'Story key is required';
          },
          filter: function(storyKey) {
            return storyKey.replace(/\D/g, '');
          }
        },
        {
          type: 'input',
          name: 'subtaskKey',
          message: 'What is the sub-task key? (e.g. 12345):',
          validate: function(subTaskKey) {
            return subTaskKey && subTaskKey.length > 0
              ? true
              : 'Sub-task key is required';
          },
          filter: function(subTaskKey) {
            return subTaskKey.replace(/\D/g, '');
          }
        },
        {
          type: 'list',
          name: 'type',
          message: "Select the type of change that you're committing:",
          choices: choices,
          default: options.defaultType
        },
        {
          type: 'input',
          name: 'scope',
          message:
            'What is the scope of this change (e.g. component or file name):',
          validate: function(scope) {
            return scope.length === 0 ? 'Scope is required' : true;
          },
          filter: function(value) {
            return options.disableScopeLowerCase
              ? value.trim()
              : value.trim().toLowerCase();
          }
        },
        {
          type: 'input',
          name: 'subject',
          message: 'Write a description of the change:',
          default: options.defaultSubject,
          validate: function(subject) {
            var filteredSubject = filterSubject(
              subject,
              options.disableSubjectLowerCase
            );
            return filteredSubject.length == 0
              ? 'description is required'
              : true;
          }
        }
      ]).then(function(answers) {
        var wrapOptions = {
          trim: true,
          cut: false,
          newline: '\n',
          indent: '',
          width: options.maxLineWidth
        };

        var storyKey = `[BEESOT-${answers.storyKey}]`;
        var subtaskKey = `[BEESOT-${answers.subtaskKey}]`;
        var type = `${answers.type}`;
        var scope = `[${answers.scope}]`;
        var subject = `${answers.subject}`;

        // Hard limit this line in the validate
        var head = `${storyKey}${subtaskKey} ${type} ${scope}: ${subject}`;

        commit(filter([head]).join('\n\n'));
      });
    }
  };
};
