import { AppDataSource } from '../../../infrastructure/database/data-source';
import { PerformanceConfig } from '../entities';
import { performanceCrypto } from '../../../common/security/performance-crypto';
import { getEnv } from '../../../common/config/env';

export class PerformanceConfigService {
  private configRepo = AppDataSource.getRepository(PerformanceConfig);

  async getConfig(key: string): Promise<PerformanceConfig | null> {
    const config = await this.configRepo.findOne({ where: { configKey: key, active: true } });
    if (!config) return null;

    return this.decryptConfig(config);
  }

  async setConfig(
    key: string,
    value: any,
    description?: string,
    category?: string
  ): Promise<PerformanceConfig> {
    const isProd = getEnv().APP_ENV === 'prod';
    const valueString = typeof value === 'string' ? value : JSON.stringify(value);

    let config = await this.configRepo.findOne({ where: { configKey: key } });

    if (config) {
      config.configValue = isProd
        ? performanceCrypto.encrypt(valueString)
        : valueString;
      if (description) config.description = description;
      if (category) config.category = category;
    } else {
      config = this.configRepo.create({
        configKey: key,
        configValue: isProd ? performanceCrypto.encrypt(valueString) : valueString,
        description,
        category,
        active: true,
      });
    }

    return this.configRepo.save(config);
  }

  async getAllConfigs(category?: string): Promise<PerformanceConfig[]> {
    const query = this.configRepo.createQueryBuilder('config')
      .where('config.active = :active', { active: true });

    if (category) {
      query.andWhere('config.category = :category', { category });
    }

    const configs = await query.getMany();
    return configs.map(c => this.decryptConfig(c));
  }

  async deleteConfig(key: string): Promise<void> {
    await this.configRepo.update({ configKey: key }, { active: false });
  }

  private decryptConfig(config: PerformanceConfig): PerformanceConfig {
    const isProd = getEnv().APP_ENV === 'prod';
    if (!isProd) return config;

    return {
      ...config,
      configValue: performanceCrypto.decrypt(config.configValue),
    };
  }
}

