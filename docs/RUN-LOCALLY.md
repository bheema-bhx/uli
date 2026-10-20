# Run Locally

## Prerequisites

- **Build Circuit**: [build circuit](BUILD-CIRCUIT.md) first  

Ensure you have the following installed:

- **Docker Engine**: Version 18.02 or higher. Installation instructions can be found at https://docs.docker.com/engine/install/

- **Docker Compose Plugin**: Ensure you have the Compose plugin installed:

```bash
docker compose version
# Install with: sudo apt install docker-compose-plugin
```

- **Blockchain Wallet**: Uli_ocl will dispatch proofs to a blockchain contract, which requires a funded wallet account on the target blockchain (for IoTeX Testnet, see how to [create a wallet](https://docs.iotex.io/the-iotex-stack/wallets/metamask), and [claim test IOTX](https://docs.iotex.io/the-iotex-stack/iotx-faucets/testnet-tokens#the-iotex-developer-portal))

- **Bonsai API Key**: If you plan to generate RISC0 snark proofs, as the Prover protocol currently relies on the [Bonsai API](https://dev.risczero.com/api/bonsai/) you'll need to get [their API key](https://docs.google.com/forms/d/e/1FAIpQLSf9mu18V65862GS4PLYd7tFTEKrl90J5GTyzw_d14ASxrruFQ/viewform).

## Create project config file
after [build circuit](BUILD-CIRCUIT.md)
- move `risc0-config.json` to `test/project`, and then rename `risc0-config.json` to `20000` (`20000` is the project id).
- move `halo2-config.json` to `test/project`, and then rename `halo2-config.json` to `20001` (`20001` is the project id).
- move `zkwasm-config.json` to `test/project`, and then rename `zkwasm-config.json` to `20002` (`20002` is the project id).

## Configure Uli_ocl

### Set your blockchain account

1. To enable the Uli_ocl instance to send proofs to the destination blockchain, configure a funded account on the target chain:

```bash
export PRIVATE_KEY=${your private key}
```

2. To use RISC0 Provers for proof generation, provide your Bonsai API Key (see prerequisites above):

```bash
export BONSAI_KEY=${your bonsai key}
```

3. Docker Compose will mount the current work directory under the `/data` volume. You can edit the file `docker-compose.yaml` to set `PROJECT_FILE_DIRECTORY` to the appropriate path where the project configuration file (which includes the prover code) is stored.

## Running Uli_ocl

Start the Uli_ocl with the following command:

```bash
cd uli_ocl
docker compose up -d
```
### Configure ioctl

Set up the `ioctl` uli_ocl endpoint to your running Uli_ocl instance (`ioctl` settings are located in `$HOME/.config/ioctl/default/config.default`)

 ```bash
 ioctl config set wsEndpoint 'localhost:9000'
 ```

After that, you can use ```ioctl config get wsEndpoint``` to make sure the config is effective.

### Monitoring and management

Monitor the Uli_ocl instance status with:

```bash
docker-compose logs -f coordinator prover
```

Shut down the Uli_ocl instance with:

```bash
docker-compose down
```

## Send testing data to the Uli_ocl instance

Uli_ocl projects are currently placed inside the folder `test/project`. Each project file name is a unique ID for the project. And each project file is composed of a JSON object definition that includes the binary code of the prover, vm type, and other parameters.

The following example sends a message to an example project deployed on the Uli_ocl instance that makes use of a RISC0 prover, which has project ID 20000, please change the project ID to yours if necessary:

```bash
ioctl ws message send --project-id 20000 --project-version "0.1" --data "{\"private_input\":\"14\", \"public_input\":\"3,34\", \"receipt_type\":\"Snark\"}"
```
## Deploy your project

### Create project

```sh
ioctl ws project --contract-address $PROJECT_REGISTER_CONTRACT_ADDR create --project-config-file path/to/project_config_file --project-config-hash ${project config sha256 hash(optional)} ## the project id will be retrieved.
```

### Update project

```sh
ioctl ws project --contract-address $PROJECT_REGISTER_CONTRACT_ADDR update --project-id $PROJECT_ID --project-config-file path/to/project_config_file --project-config-hash ${project config sha256 hash(optional)}
```

### Query project

```sh
ioctl ws project --contract-address $PROJECT_REGISTER_CONTRACT_ADDR query --project-id $PROJECT_ID
```



