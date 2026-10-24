// Metro resolves `.glb` imports to an asset id (see metro.config.js).
declare module "*.glb" {
  const asset: number;
  export default asset;
}
