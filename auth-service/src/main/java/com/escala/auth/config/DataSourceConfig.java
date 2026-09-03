package com.escala.auth.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Aceita DATABASE_URL no formato postgres://user:senha@host:porta/banco
 * (o formato que o Neon fornece direto no painel) e converte para uma
 * DataSource JDBC. Sem isso, seria preciso reformatar a URL manualmente
 * a cada deploy — mesma ideia do dj_database_url usado no backend Django.
 */
@Configuration
public class DataSourceConfig {

    @Bean
    @ConditionalOnProperty(name = "DATABASE_URL")
    public DataSource dataSource(@Value("${DATABASE_URL}") String databaseUrl) {
        URI uri;
        try {
            uri = new URI(databaseUrl);
        } catch (URISyntaxException e) {
            throw new IllegalStateException("DATABASE_URL inválida: " + databaseUrl, e);
        }

        String[] userInfo = uri.getUserInfo() != null ? uri.getUserInfo().split(":", 2) : new String[0];
        String username = userInfo.length > 0 ? userInfo[0] : null;
        String password = userInfo.length > 1 ? userInfo[1] : null;

        int port = uri.getPort() != -1 ? uri.getPort() : 5432;
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath();

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(jdbcUrl);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName("org.postgresql.Driver");
        return dataSource;
    }
}
