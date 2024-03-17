module.exports = (app) => {

  const axios = require('axios');

  app.log.info("App is up and running!");

  // Issue opened
  app.on("issues.opened", async (context) => {

    const commenter = context.payload.issue.user.login;

    const body = `Hello @${commenter}! 👋 \n\n I'm a friendly AI Bot, designed to chat with you in this repository. \n If you have any questions or need help with something, feel free to ask, and I'll do my best to assist you. \n Have a great day! \n\n Best regards,\n The GitHubGPT AI Bot 🤖`;

    const issueComment = context.issue({
      body: body,
    });
    return context.octokit.issues.createComment(issueComment);
  });

  // Issue comment created
  app.on("issue_comment.created", async (context) => {

    if (context.payload.comment.user.type === 'User') {

      const message = context.payload.comment.body;

      const payload = {
        "model": "Nous-Hermes2",
        "max_tokens": 500,
        "messages": [
          {
            "role": "user",
            "content": message
          }
        ]
      };

      axios.post('http://localhost:4891/v1/chat/completions', payload)
        .then(response => {
          const responseData = response.data;

          const newObject = {
            choiceMessages: responseData.choices.map(choice => choice.message),
            createdTimestamp: responseData.created,
            requestId: responseData.id,
            modelName: responseData.model,
            objectType: responseData.object,
            tokenUsage: responseData.usage
          };

          const issueComment = context.issue({
            body: newObject.choiceMessages[0].content,
          });

          context.octokit.issues.createComment(issueComment);

        })
        .catch(error => {
          console.error('An error occurred! ', error);
        });
    }
  });

};
