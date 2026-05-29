package com.techtammina.crm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CrmCustomerServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(CrmCustomerServiceApplication.class, args);
	}

}

