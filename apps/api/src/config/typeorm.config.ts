import {ConfigService} from "@nestjs/config";
import {TypeOrmModuleOptions} from "@nestjs/typeorm";

export async function getTypeOrmConfig(configService: ConfigService): Promise<TypeOrmModuleOptions> {
    const sslDisabled = configService.get<string>('DATABASE_SSL') === 'false';
    return {
        type:'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: sslDisabled ? false : { rejectUnauthorized: false },
    }
}