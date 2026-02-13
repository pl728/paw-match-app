import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Flex, Heading, Text, Box, Button } from "@radix-ui/themes";
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { getMyProfile } from "../services/users.js";
import { deleteShelter } from "../services/shelters.js";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    setLoading(true);
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteShelter() {
    if (!profile?.shelter?.id) return;

    setDeleting(true);
    try {
      await deleteShelter(profile.shelter.id);
      // Refresh profile to show "Create Shelter" button
      await fetchProfileData();
    } catch (err) {
      alert(`Error deleting shelter: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
        <Text size="2" color="gray">Loading profile…</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
        <Text size="2" color="red">{error}</Text>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
      <Flex direction="column" gap="4">
        <Card size="3">
          <Flex direction="column" gap="3">
            <Heading size="6">Profile</Heading>

            <Box>
              <Text size="2" weight="bold" as="div">Username</Text>
              <Text size="2" color="gray">{profile.username}</Text>
            </Box>

            <Box>
              <Text size="2" weight="bold" as="div">Role</Text>
              <Text size="2" color="gray">
                {profile.role === 'shelter_admin' ? 'Shelter Admin' : 'Adopter'}
              </Text>
            </Box>

            <Box>
              <Text size="2" weight="bold" as="div">Member since</Text>
              <Text size="2" color="gray">
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </Box>
          </Flex>
        </Card>

        {profile.role === 'shelter_admin' && !profile.shelter && (
          <Card size="3" style={{ textAlign: 'center' }}>
            <Flex direction="column" gap="3" align="center">
              <Heading size="5">Set Up Your Shelter</Heading>
              <Text size="2" color="gray">
                You need to create a shelter profile before you can add pets.
              </Text>
              <Button size="3" onClick={() => navigate('/setup-shelter')}>
                Create Shelter
              </Button>
            </Flex>
          </Card>
        )}

        {profile.role === 'shelter_admin' && profile.shelter && (
          <Card size="3">
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Heading size="5">Shelter Information</Heading>
                <AlertDialog.Root>
                  <AlertDialog.Trigger asChild>
                    <Button color="red" variant="soft" size="2">
                      Delete Shelter
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Portal>
                    <AlertDialog.Overlay style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.5)',
                      zIndex: 9998
                    }} />
                    <AlertDialog.Content style={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '90%',
                      maxWidth: '500px',
                      background: 'white',
                      borderRadius: '12px',
                      padding: '24px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                      zIndex: 9999
                    }}>
                      <AlertDialog.Title style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: '#2d1810',
                        display: 'block'
                      }}>
                        Delete Shelter?
                      </AlertDialog.Title>
                      <AlertDialog.Description style={{
                        fontSize: '0.95rem',
                        color: '#5d3a2a',
                        marginBottom: '24px',
                        lineHeight: 1.6,
                        display: 'block'
                      }}>
                        This will permanently delete your shelter and <strong>all {profile.pets?.length || 0} pets</strong> associated with it. This action cannot be undone.
                      </AlertDialog.Description>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <AlertDialog.Cancel asChild>
                          <Button variant="soft" color="gray" size="2">
                            Cancel
                          </Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <Button color="red" size="2" onClick={handleDeleteShelter} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete Shelter'}
                          </Button>
                        </AlertDialog.Action>
                      </div>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog.Root>
              </Flex>

              <Box>
                <Text size="2" weight="bold" as="div">Name</Text>
                <Text size="2" color="gray">{profile.shelter.name}</Text>
              </Box>

              {profile.shelter.description && (
                <Box>
                  <Text size="2" weight="bold" as="div">Description</Text>
                  <Text size="2" color="gray">{profile.shelter.description}</Text>
                </Box>
              )}

              {profile.shelter.phone && (
                <Box>
                  <Text size="2" weight="bold" as="div">Phone</Text>
                  <Text size="2" color="gray">{profile.shelter.phone}</Text>
                </Box>
              )}

              {profile.shelter.email && (
                <Box>
                  <Text size="2" weight="bold" as="div">Email</Text>
                  <Text size="2" color="gray">{profile.shelter.email}</Text>
                </Box>
              )}

              {(profile.shelter.address_line1 || profile.shelter.city) && (
                <Box>
                  <Text size="2" weight="bold" as="div">Address</Text>
                  <Text size="2" color="gray">
                    {profile.shelter.address_line1 && <>{profile.shelter.address_line1}<br /></>}
                    {profile.shelter.address_line2 && <>{profile.shelter.address_line2}<br /></>}
                    {profile.shelter.city && profile.shelter.state &&
                      `${profile.shelter.city}, ${profile.shelter.state} ${profile.shelter.postal_code || ''}`
                    }
                  </Text>
                </Box>
              )}
            </Flex>
          </Card>
        )}

        {profile.role === 'shelter_admin' && profile.pets && profile.pets.length > 0 && (
          <Card size="3">
            <Flex direction="column" gap="3">
              <Heading size="5">My Pets ({profile.pets.length})</Heading>

              <Flex direction="column" gap="2">
                {profile.pets.map(pet => (
                  <Box
                    key={pet.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <Flex justify="between" align="center">
                      <Box>
                        <Text size="2" weight="bold">{pet.name}</Text>
                        <Text size="1" color="gray" style={{ display: 'block' }}>
                          {pet.species} • {pet.breed} • {pet.age_years} years • {pet.sex}
                        </Text>
                      </Box>
                      <Text
                        size="1"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: pet.status === 'available' ? '#52b788' : '#a89b8e',
                          color: 'white'
                        }}
                      >
                        {pet.status}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </div>
  );
}

export default Profile;
