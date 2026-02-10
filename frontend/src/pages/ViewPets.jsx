import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { getPets } from "../services/pets.js";


function ViewPets() {
    const [pets, setPets] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isActive = true;
        async function fetchPets() {
            try {
                const data = await getPets();
                if (isActive) {
                    setPets(data);
                }
            } catch (err) {
                if (isActive) {
                    setError(err.message);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }
        fetchPets();
        return () => {
            isActive = false;
        };
    }, []);

    return (
        <div style={{ padding: "2rem" }}> 
            <Card size="3" variant="ghost">
                <Flex direction="column" gap="3">
                    <Heading size="6">View Pets</Heading>
                    {loading && <Text size="2" color="gray">Loading pets…</Text>}
                    {error && <Text size="2" color="red">{error}</Text>}
                    {!loading && !error && (
                        <pre style={{ whiteSpace: "pre-wrap" }}>
                            {JSON.stringify(pets, null, 2)}
                        </pre>
                    )}
                    <Link to="/home"><button>Home</button></Link>
                </Flex>
            </Card>
        </div>
        
    );  
}

export default ViewPets;
