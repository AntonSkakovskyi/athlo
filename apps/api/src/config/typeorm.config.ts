import {ConfigService} from "@nestjs/config";
import {TypeOrmModuleOptions} from "@nestjs/typeorm";

export async function getTypeOrmConfig(configService: ConfigService): Promise<TypeOrmModuleOptions> {
    return {
        type:'postgres',
        url: configService.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: {
            rejectUnauthorized: false,
        },
    }
}