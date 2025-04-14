# Instructions for Running Dark Forest Arena Client:

1. `git clone https://github.com/dfdao/darkforest-local.git`
2. `git checkout arena`
3. `git submodule update --init --recursive`
4. Manually check out the `arena` branch of `client`, `eth`, and `packages` OR use the utility script:
    `sh checkout.sh arena`
5. `yarn`
5. If you want a different RPC provider for the client, create a `.env` file that is a copy of `.env.example` and update `DEFAULT_RPC` accordingly.
5. `yarn start:client`

You can now develop the Arena client with hot reloading.

# Troubleshooting / Warnings
- Do not run any command that deploys contracts, even for local testing, eg `yarn workspace eth test`.  
    - This will overwrite the `@darkforest_eth/contracts` package and your client will no longer be able to connect to a production network.

- If you're developing a plugin, the client will reload every time you make an edit, which is quite annoying.
- You can edit the `start` command in `client/package.json` and remove the `--hot` flag if you don't want this behavior.
