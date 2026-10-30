// Metro resolves `.vrm` imports to an asset id (see metro.config.js).
declare module "*.vrm" {
  const asset: number;
  export default asset;
}
