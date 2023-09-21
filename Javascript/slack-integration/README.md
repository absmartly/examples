# ABsmartly Slack Integration Example

This repository contains an example of how to integrate ABsmartly with Slack.

An article on how the beginnings of this example can be found [on the absmartly docs](https://docs.absmartly.com/docs/examples/slack-integration).

## Setup

1. Fork the repo
2. Create a new Slack app at https://api.slack.com/apps
3. Obtain a Slack OAuth token and a channel Webhook URL
4. Create a role on the ABsmartly dashboard with GET and LIST permissions for "experiments" and "users"
5. Create a user on the ABsmartly dashboard for your Slack app with the role you just created.
6. Create a user API Key for the user you just created.
7. Populate the environment variables in `.env` (You can check `.env.example` for reference).
8. Push the nodeJS app to [Render.com](https://render.com) or your preferred hosting provider.
9. Test the integration by creating a draft experiment on the ABsmartly Web Console.
