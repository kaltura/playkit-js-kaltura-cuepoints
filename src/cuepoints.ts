export class Cuepoints extends KalturaPlayer.core.BasePlugin{
  /**
   * The default configuration of the plugin.
   * @static
   */
  static defaultConfig = {

  };

  constructor(name: string, player: any) {
    super(name, player);
  }

  /**
   * @static
   * @public
   * @returns {boolean} - Whether the plugin is valid.
   */
  static isValid(): boolean {
    return true;
  }

}
