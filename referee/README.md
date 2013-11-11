
## Rest API


GET /board/:board_name
  [{username, script:{}, score, record:{wins,losses,ties}}]

GET /user/:username
  {username, avatar, scripts:[]}


POST /github-callback
  {username}

POST /script/:sha1
  name=
  source=
  compiledBytes=


## Redis Model

```
"user:username" -> {username, avatar}
"script:sha1" -> {sha1, username, scriptName, source, compiledBytes}

"match:sha1:sha1" -> [
  {order, script_sha1, username, score, record:{wins,losses,ties}}
]

"board:name" -> [
  {username, script_sha1, score, record}
]

```

