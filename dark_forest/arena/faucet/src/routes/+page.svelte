<script lang="ts">
    let pubkey: string = "0xPublicKey";
</script>

<div class="container">
    <div class="container">
        <h1>Spacemandev DF Arena Faucet</h1>
        <p>
            Put in your public key and hit GO to get 5 ETH on test network.
            Takes a few seconds. Can grab a burner key <a
                href="https://vanity-eth.tk/"
                target="_blank">here</a
            >. Go to bottom of page and click 'generate'. Copy the address.
        </p>
        <div>
            <input type="text" bind:value={pubkey} placeholder="0xPublicKey" />
            <button
                on:click={async () => {
                    const response = await fetch("/faucet", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            pubkey,
                        }),
                    });
                    const j = await response.json();
                    if (j.success) {
                        alert("5 ETH Transferred.");
                    } else {
                        alert("Something went wrong");
                    }
                }}>GO</button
            >
        </div>
    </div>
    <div class="footer">Made by Spacemandev</div>
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
    }

    .footer {
        position: fixed;
        bottom: 0;
        width: 100%;
        text-align: center;
    }
</style>
