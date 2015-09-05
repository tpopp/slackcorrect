Simple app I threw together over an hour to allow autocorrect of slack messages when you type "[correction]*"

I wanted to allow this to work for multiple people but slack's api is currently lacking in support for efficient slackbot like features that dont' act as an independent account.
Warning: This script requires a slight modification to the slack-auth package, changing it to not overwrite the given token passed in to an http request.

I don't have future plans currently other than my personal use.
