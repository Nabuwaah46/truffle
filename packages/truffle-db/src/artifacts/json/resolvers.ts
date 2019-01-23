import fs from "fs";

const TruffleResolver = require("truffle-resolver");

export interface ITruffleResolver {
  require(name: string): any
}

interface IContext {
  artifactsDirectory: string,
  workingDirectory?: string,
}

export const resolvers = {
  Query: {
    contract: {
      resolve (_, { name, networkId }, context: IContext) {
        const truffleResolver: ITruffleResolver = new TruffleResolver({
          contracts_build_directory: context.artifactsDirectory,
          working_directory: context.workingDirectory || process.cwd()
        });

        const artifact = truffleResolver.require(name)._json;

        const result = {
          ...artifact,

          abi: {
            json: JSON.stringify(artifact.abi),
            items: artifact.abi
          }
        };

        if (networkId) {
          return (result.networks[networkId])
            ? {
                ...result,
                networks: {
                  [networkId]: result.networks[networkId]
                }
              }
            : null
        }
        return result;
      }
    },
    contractNames: {
      resolve (_, {}, context: IContext): string[] {
        const contents = fs.readdirSync(context.artifactsDirectory)

        return contents
          .filter( (filename) => filename.endsWith(".json") )
          .map( (filename) => filename.slice(0, -5) );
      }
    }
  },

  AbiItem: {
    __resolveType(obj) {
      switch (obj.type) {
        case "event":
          return "Event";
        case "constructor":
          return "ConstructorFunction";
        case "fallback":
          return "FallbackFunction";
        case "function":
        default:
          return "NormalFunction";
      }
    }
  },

  ContractObject: {
    networks: {
      resolve ({ networks }) {
        return Object.entries(networks).map(
          ([ networkId, networkObject ]) => ({ networkId, networkObject })
        );
      }
    }
  },

  NormalFunction: {
    type: {
      resolve (value) {
        return "function";
      }
    }
  }
};