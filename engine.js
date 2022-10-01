'format cjs';

const map = require('lodash.map');
const longest = require('longest');
const readConfigFile = require('./read-config-file.js');

const filter = function(array) {
  return array.filter(function(x) {
    return x;
  });
};

const filterSubject = function(subject, disableSubjectLowerCase) {
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
  const types = options.types;

  const length = longest(Object.keys(types)).length + 1;
  const choices = map(types, function(type, key) {
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
      const config = readConfigFile();
      let jiraKey = 'OS';

      if (config) {
        if (config.jiraKey) jiraKey = config.jiraKey;
      }

      cz.prompt([
        {
          type: 'input',
          name: 'storyKey',
          message: `What is the story key? (e.g. ${jiraKey}-12345):`,
          transformer: function(storyKey) {
            return `${jiraKey}-${storyKey}`;
          },
          validate: function(storyKey) {
            if (!storyKey || storyKey.length === 0) {
              return 'Story key is required';
            }

            if (/\D/g.test(storyKey)) return 'Story key only supports numbers';

            return true;
          }
        },
        {
          type: 'input',
          name: 'subtaskKey',
          message: `What is the sub-task key? (e.g. ${jiraKey}-12345):`,
          transformer: function(subtaskKey) {
            return `${jiraKey}-${subtaskKey}`;
          },
          validate: function(subtaskKey) {
            if (!subtaskKey || subtaskKey.length === 0) {
              return 'Sub-task key is required';
            }

            if (/\D/g.test(subtaskKey))
              return 'Sub-task key only supports numbers';

            return true;
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
            const filteredSubject = filterSubject(
              subject,
              options.disableSubjectLowerCase
            );
            return filteredSubject.length == 0
              ? 'description is required'
              : true;
          }
        }
      ]).then(function(answers) {
        const storyKey = `[${jiraKey}-${answers.storyKey}]`;
        const subtaskKey = `[${jiraKey}-${answers.subtaskKey}]`;
        const type = `${answers.type}`;
        const scope = `[${answers.scope}]`;
        const subject = `${answers.subject}`;

        // Hard limit this line in the validate
        const head = `${storyKey}${subtaskKey} ${type} ${scope}: ${subject}`;

        commit(filter([head]).join('\n\n'));
      });
    }
  };
};
