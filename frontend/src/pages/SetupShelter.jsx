import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Heading, Text, TextField, TextArea, Button } from "@radix-ui/themes";
import { createShelter } from "../services/shelters.js";

function SetupShelter() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: ""
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await createShelter(formData);
      navigate('/profile');
    } catch (err) {
      alert(`Error creating shelter: ${err.message}`);
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 73px)',
      padding: '40px 20px'
    }}>
      <Card size="4" style={{ width: '100%', maxWidth: '600px' }}>
        <Flex direction="column" gap="4">
          <Heading size="6" align="center">Set Up Your Shelter</Heading>
          <Text size="2" color="gray" align="center">
            Please provide information about your shelter to get started.
          </Text>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Shelter Name *</Text>
                <TextField.Root
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter shelter name"
                  required
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Description</Text>
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell us about your shelter..."
                  rows={4}
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Phone *</Text>
                <TextField.Root
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  required
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Email *</Text>
                <TextField.Root
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@shelter.com"
                  required
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Address Line 1 *</Text>
                <TextField.Root
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  required
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">Address Line 2</Text>
                <TextField.Root
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  placeholder="Suite 100"
                />
              </label>

              <Flex gap="3">
                <label style={{ flex: 1 }}>
                  <Text as="div" size="2" mb="1" weight="bold">City *</Text>
                  <TextField.Root
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    required
                  />
                </label>

                <label style={{ width: '100px' }}>
                  <Text as="div" size="2" mb="1" weight="bold">State *</Text>
                  <TextField.Root
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="OR"
                    maxLength={2}
                    required
                  />
                </label>

                <label style={{ width: '120px' }}>
                  <Text as="div" size="2" mb="1" weight="bold">Zip Code *</Text>
                  <TextField.Root
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="97210"
                    required
                  />
                </label>
              </Flex>

              <Button type="submit" size="3" style={{ marginTop: '12px' }}>
                Create Shelter
              </Button>
            </Flex>
          </form>
        </Flex>
      </Card>
    </div>
  );
}

export default SetupShelter;
